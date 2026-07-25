import { schema, eq, inArray } from '@learnova/database';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  SystemRole,
  canAssignRolePower,
  canManageByPower,
  decodePermissions,
} from '@learnova/shared';
import { db } from '../../core/database.js';
import { usersRepository } from './users.repository.js';
import { recordAudit } from '../audit/audit.service.js';

function publicUser(row: Awaited<ReturnType<typeof usersRepository.findById>>) {
  if (!row) return null;
  const { passwordHash, ...rest } = row;
  void passwordHash;
  return rest;
}

async function enrichUser(userId: string) {
  const user = await usersRepository.findById(userId);
  if (!user) return null;
  const roles = await usersRepository.getUserRoles(userId);
  const power = roles.length ? Math.max(...roles.map((r) => r.power)) : 0;
  const { mask } = await usersRepository.getEffectivePermissions(userId);
  return {
    ...publicUser(user),
    roles,
    power,
    permissions: decodePermissions(mask),
  };
}

async function assertCanManageUser(actorId: string, targetId: string): Promise<{
  actorPower: number;
  targetPower: number;
}> {
  if (actorId === targetId) {
    throw new ForbiddenError('You cannot perform this action on your own account');
  }
  const [actorPower, targetPower] = await Promise.all([
    usersRepository.getUserPower(actorId),
    usersRepository.getUserPower(targetId),
  ]);
  if (!canManageByPower(actorPower, targetPower)) {
    throw new ForbiddenError('This user outranks you — you cannot manage them');
  }
  return { actorPower, targetPower };
}

export const usersService = {
  async getProfile(userId: string) {
    const enriched = await enrichUser(userId);
    if (!enriched) throw new NotFoundError('User not found');
    return enriched;
  },

  async updateProfile(
    userId: string,
    input: { name?: string; bio?: string; headline?: string; avatarUrl?: string },
  ) {
    const updated = await usersRepository.update(userId, input);
    await recordAudit({
      actorId: userId,
      action: 'user.update_profile',
      entityType: 'user',
      entityId: userId,
      newData: input,
    });
    return publicUser(updated);
  },

  async list(params: { limit: number; offset: number; search?: string }) {
    const { items, total } = await usersRepository.list(params);
    const enriched = await Promise.all(
      items.map(async (user) => {
        const roles = await usersRepository.getUserRoles(user.id);
        const power = roles.length ? Math.max(...roles.map((r) => r.power)) : 0;
        return { ...publicUser(user), roles, power };
      }),
    );
    return { items: enriched, total };
  },

  async adminUpdate(actorId: string, userId: string, input: { isBanned?: boolean; isActive?: boolean }) {
    await assertCanManageUser(actorId, userId);
    const target = await usersRepository.findById(userId);
    if (!target) throw new NotFoundError('User not found');
    const updated = await usersRepository.update(userId, input);
    await recordAudit({
      actorId,
      action: 'admin.user_update',
      entityType: 'user',
      entityId: userId,
      previousData: { isBanned: target.isBanned, isActive: target.isActive },
      newData: input,
    });
    return enrichUser(userId).then((u) => u ?? publicUser(updated));
  },

  /** Only admins call this; promotes a student to instructor. */
  async promoteToInstructor(actorId: string, userId: string) {
    const { actorPower } = await assertCanManageUser(actorId, userId);
    const user = await usersRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    const [role] = await db()
      .select()
      .from(schema.roles)
      .where(eq(schema.roles.slug, SystemRole.INSTRUCTOR))
      .limit(1);
    if (!role) throw new NotFoundError('Instructor role not found');
    if (!canAssignRolePower(actorPower, role.power)) {
      throw new ForbiddenError('You cannot assign a role at or above your power');
    }

    const currentRoles = await usersRepository.getRoleSlugs(userId);
    if (currentRoles.includes(SystemRole.INSTRUCTOR)) {
      throw new ConflictError('User is already an instructor');
    }
    await usersRepository.assignRole(userId, role.id, actorId);
    await recordAudit({
      actorId,
      action: 'admin.create_instructor',
      entityType: 'user',
      entityId: userId,
    });
    return this.getProfile(userId);
  },

  async setRoles(actorId: string, userId: string, roleIds: string[]) {
    const { actorPower } = await assertCanManageUser(actorId, userId);

    const uniqueIds = [...new Set(roleIds)];
    let roles: (typeof schema.roles.$inferSelect)[] = [];
    if (uniqueIds.length > 0) {
      roles = await db().select().from(schema.roles).where(inArray(schema.roles.id, uniqueIds));
      if (roles.length !== uniqueIds.length) {
        throw new BadRequestError('One or more roles were not found');
      }
      for (const role of roles) {
        if (!canAssignRolePower(actorPower, role.power)) {
          throw new ForbiddenError(
            `You cannot assign the "${role.name}" role — it is at or above your power`,
          );
        }
      }
    }

    const previous = await usersRepository.getUserRoles(userId);
    await usersRepository.setUserRoles(userId, uniqueIds, actorId);
    await recordAudit({
      actorId,
      action: 'admin.user_set_roles',
      entityType: 'user',
      entityId: userId,
      previousData: { roles: previous.map((r) => r.slug) },
      newData: { roles: roles.map((r) => r.slug) },
    });
    return this.getProfile(userId);
  },

  async remove(actorId: string, userId: string) {
    await assertCanManageUser(actorId, userId);
    await usersRepository.softDelete(userId);
    await recordAudit({
      actorId,
      action: 'admin.user_delete',
      entityType: 'user',
      entityId: userId,
    });
  },
};
