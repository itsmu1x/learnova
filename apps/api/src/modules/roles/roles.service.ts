import { schema, eq, asc, desc } from '@learnova/database';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  canAssignRolePower,
  canManageByPower,
  decodePermissions,
  encodePermissions,
  hasAllPermissions,
  slugify,
  type PermissionKey,
} from '@learnova/shared';
import { db } from '../../core/database.js';
import { recordAudit } from '../audit/audit.service.js';
import { usersRepository } from '../users/users.repository.js';

function serializeRole(role: typeof schema.roles.$inferSelect) {
  return {
    id: role.id,
    slug: role.slug,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    power: role.power,
    permissions: role.permissions.toString(),
    permissionKeys: decodePermissions(role.permissions),
  };
}

async function syncRolePermissionRows(roleId: string, mask: bigint): Promise<void> {
  const perms = await db().select().from(schema.permissions);
  await db().delete(schema.rolePermissions).where(eq(schema.rolePermissions.roleId, roleId));
  const rows = perms
    .filter((p) => (mask & p.bit) === p.bit)
    .map((p) => ({ roleId, permissionId: p.id }));
  if (rows.length) await db().insert(schema.rolePermissions).values(rows);
}

async function actorContext(actorId: string) {
  const actorPower = await usersRepository.getUserPower(actorId);
  const { mask } = await usersRepository.getEffectivePermissions(actorId);
  return { actorPower, actorMask: mask };
}

function assertActorOutranksRole(actorPower: number, rolePower: number, action: string): void {
  if (!canManageByPower(actorPower, rolePower)) {
    throw new ForbiddenError(`You cannot ${action} a role at or above your power`);
  }
}

export const rolesService = {
  async list() {
    const rows = await db().select().from(schema.roles).orderBy(desc(schema.roles.power), asc(schema.roles.name));
    return rows.map(serializeRole);
  },

  async get(id: string) {
    const [role] = await db().select().from(schema.roles).where(eq(schema.roles.id, id)).limit(1);
    if (!role) throw new NotFoundError('Role not found');
    return serializeRole(role);
  },

  async create(
    actorId: string,
    input: {
      name: string;
      description?: string;
      permissionKeys: PermissionKey[];
      power: number;
    },
  ) {
    const { actorPower, actorMask } = await actorContext(actorId);
    if (!Number.isInteger(input.power) || input.power < 1 || input.power > 100) {
      throw new BadRequestError('Power must be an integer between 1 and 100');
    }
    if (!canAssignRolePower(actorPower, input.power)) {
      throw new ForbiddenError('Role power must be lower than your own');
    }

    const mask = encodePermissions(input.permissionKeys);
    if (!hasAllPermissions(actorMask, mask)) {
      throw new ForbiddenError('You cannot grant permissions you do not hold');
    }

    const slug = slugify(input.name);
    const [existing] = await db()
      .select()
      .from(schema.roles)
      .where(eq(schema.roles.slug, slug))
      .limit(1);
    if (existing) throw new ConflictError('A role with this name already exists');

    const [role] = await db()
      .insert(schema.roles)
      .values({
        slug,
        name: input.name,
        description: input.description,
        permissions: mask,
        power: input.power,
        isSystem: false,
      })
      .returning();
    await syncRolePermissionRows(role!.id, mask);
    await recordAudit({
      actorId,
      action: 'role.create',
      entityType: 'role',
      entityId: role!.id,
      newData: { name: input.name, power: input.power, permissionKeys: input.permissionKeys },
    });
    return serializeRole(role!);
  },

  async update(
    actorId: string,
    id: string,
    input: {
      name?: string;
      description?: string;
      permissionKeys?: PermissionKey[];
      power?: number;
    },
  ) {
    const [role] = await db().select().from(schema.roles).where(eq(schema.roles.id, id)).limit(1);
    if (!role) throw new NotFoundError('Role not found');

    const { actorPower, actorMask } = await actorContext(actorId);
    assertActorOutranksRole(actorPower, role.power, 'edit');

    if (input.power !== undefined) {
      if (role.isSystem) {
        throw new ForbiddenError('System role power cannot be changed');
      }
      if (!Number.isInteger(input.power) || input.power < 1 || input.power > 100) {
        throw new BadRequestError('Power must be an integer between 1 and 100');
      }
      if (!canAssignRolePower(actorPower, input.power)) {
        throw new ForbiddenError('Role power must be lower than your own');
      }
    }

    const previous = serializeRole(role);
    const mask =
      input.permissionKeys !== undefined ? encodePermissions(input.permissionKeys) : role.permissions;

    if (input.permissionKeys !== undefined && !hasAllPermissions(actorMask, mask)) {
      throw new ForbiddenError('You cannot grant permissions you do not hold');
    }

    const [updated] = await db()
      .update(schema.roles)
      .set({
        name: input.name ?? role.name,
        description: input.description ?? role.description,
        permissions: mask,
        power: input.power ?? role.power,
        updatedAt: new Date(),
      })
      .where(eq(schema.roles.id, id))
      .returning();

    if (input.permissionKeys !== undefined) await syncRolePermissionRows(id, mask);

    await recordAudit({
      actorId,
      action: 'role.update',
      entityType: 'role',
      entityId: id,
      previousData: previous,
      newData: serializeRole(updated!),
    });
    return serializeRole(updated!);
  },

  async remove(actorId: string, id: string) {
    const [role] = await db().select().from(schema.roles).where(eq(schema.roles.id, id)).limit(1);
    if (!role) throw new NotFoundError('Role not found');
    if (role.isSystem) throw new ConflictError('System roles cannot be deleted');

    const { actorPower } = await actorContext(actorId);
    assertActorOutranksRole(actorPower, role.power, 'delete');

    await db().delete(schema.roles).where(eq(schema.roles.id, id));
    await recordAudit({ actorId, action: 'role.delete', entityType: 'role', entityId: id });
  },
};
