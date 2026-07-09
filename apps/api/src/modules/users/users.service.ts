import { schema, eq } from '@learnova/database';
import {
  ConflictError,
  NotFoundError,
  SystemRole,
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

export const usersService = {
  async getProfile(userId: string) {
    const user = await usersRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    const { roles, mask } = await usersRepository.getEffectivePermissions(userId);
    return { ...publicUser(user), roles, permissions: decodePermissions(mask) };
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
        const { roles } = await usersRepository.getEffectivePermissions(user.id);
        return { ...publicUser(user), roles };
      }),
    );
    return { items: enriched, total };
  },

  async adminUpdate(actorId: string, userId: string, input: { isBanned?: boolean; isActive?: boolean }) {
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
    return publicUser(updated);
  },

  /** Only admins call this; promotes a student to instructor. */
  async promoteToInstructor(actorId: string, userId: string) {
    const user = await usersRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    const [role] = await db()
      .select()
      .from(schema.roles)
      .where(eq(schema.roles.slug, SystemRole.INSTRUCTOR))
      .limit(1);
    if (!role) throw new NotFoundError('Instructor role not found');

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

  async remove(actorId: string, userId: string) {
    await usersRepository.softDelete(userId);
    await recordAudit({
      actorId,
      action: 'admin.user_delete',
      entityType: 'user',
      entityId: userId,
    });
  },
};
