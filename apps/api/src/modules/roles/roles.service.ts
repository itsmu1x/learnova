import { schema, eq, asc } from '@learnova/database';
import {
  ConflictError,
  NotFoundError,
  decodePermissions,
  encodePermissions,
  slugify,
  type PermissionKey,
} from '@learnova/shared';
import { db } from '../../core/database.js';
import { recordAudit } from '../audit/audit.service.js';

function serializeRole(role: typeof schema.roles.$inferSelect) {
  return {
    id: role.id,
    slug: role.slug,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
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

export const rolesService = {
  async list() {
    const rows = await db().select().from(schema.roles).orderBy(asc(schema.roles.name));
    return rows.map(serializeRole);
  },

  async get(id: string) {
    const [role] = await db().select().from(schema.roles).where(eq(schema.roles.id, id)).limit(1);
    if (!role) throw new NotFoundError('Role not found');
    return serializeRole(role);
  },

  async create(
    actorId: string,
    input: { name: string; description?: string; permissionKeys: PermissionKey[] },
  ) {
    const slug = slugify(input.name);
    const [existing] = await db()
      .select()
      .from(schema.roles)
      .where(eq(schema.roles.slug, slug))
      .limit(1);
    if (existing) throw new ConflictError('A role with this name already exists');

    const mask = encodePermissions(input.permissionKeys);
    const [role] = await db()
      .insert(schema.roles)
      .values({
        slug,
        name: input.name,
        description: input.description,
        permissions: mask,
        isSystem: false,
      })
      .returning();
    await syncRolePermissionRows(role!.id, mask);
    await recordAudit({
      actorId,
      action: 'role.create',
      entityType: 'role',
      entityId: role!.id,
      newData: { name: input.name, permissionKeys: input.permissionKeys },
    });
    return serializeRole(role!);
  },

  async update(
    actorId: string,
    id: string,
    input: { name?: string; description?: string; permissionKeys?: PermissionKey[] },
  ) {
    const [role] = await db().select().from(schema.roles).where(eq(schema.roles.id, id)).limit(1);
    if (!role) throw new NotFoundError('Role not found');

    const previous = serializeRole(role);
    const mask =
      input.permissionKeys !== undefined ? encodePermissions(input.permissionKeys) : role.permissions;

    const [updated] = await db()
      .update(schema.roles)
      .set({
        name: input.name ?? role.name,
        description: input.description ?? role.description,
        permissions: mask,
        updatedAt: new Date(),
      })
      .where(eq(schema.roles.id, id))
      .returning();

    if (input.permissionKeys !== undefined) await syncRolePermissionRows(id, mask);

    await recordAudit({
      actorId,
      action: 'role.update_permissions',
      entityType: 'role',
      entityId: id,
      previousData: { permissionKeys: previous.permissionKeys },
      newData: { permissionKeys: decodePermissions(mask) },
    });
    return serializeRole(updated!);
  },

  async remove(actorId: string, id: string) {
    const [role] = await db().select().from(schema.roles).where(eq(schema.roles.id, id)).limit(1);
    if (!role) throw new NotFoundError('Role not found');
    if (role.isSystem) throw new ConflictError('System roles cannot be deleted');
    await db().delete(schema.roles).where(eq(schema.roles.id, id));
    await recordAudit({ actorId, action: 'role.delete', entityType: 'role', entityId: id });
  },
};
