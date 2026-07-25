import { schema, and, eq, isNull, desc, sql, ilike, or } from '@learnova/database';
import { db } from '../../core/database.js';

export type UserRow = typeof schema.users.$inferSelect;

export const usersRepository = {
  async findById(id: string): Promise<UserRow | undefined> {
    const [row] = await db()
      .select()
      .from(schema.users)
      .where(and(eq(schema.users.id, id), isNull(schema.users.deletedAt)))
      .limit(1);
    return row;
  },

  async findByEmail(email: string): Promise<UserRow | undefined> {
    const [row] = await db()
      .select()
      .from(schema.users)
      .where(and(eq(schema.users.email, email.toLowerCase()), isNull(schema.users.deletedAt)))
      .limit(1);
    return row;
  },

  async findByProvider(provider: 'google' | 'github', providerId: string) {
    const [row] = await db()
      .select()
      .from(schema.users)
      .where(and(eq(schema.users.provider, provider), eq(schema.users.providerId, providerId)))
      .limit(1);
    return row;
  },

  async create(values: typeof schema.users.$inferInsert): Promise<UserRow> {
    const [row] = await db()
      .insert(schema.users)
      .values({ ...values, email: values.email.toLowerCase() })
      .returning();
    return row!;
  },

  async update(id: string, values: Partial<typeof schema.users.$inferInsert>): Promise<UserRow> {
    const [row] = await db()
      .update(schema.users)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(schema.users.id, id))
      .returning();
    return row!;
  },

  async softDelete(id: string): Promise<void> {
    await db()
      .update(schema.users)
      .set({ deletedAt: new Date(), isActive: false })
      .where(eq(schema.users.id, id));
  },

  /** Roles a user holds, as slugs. */
  async getRoleSlugs(userId: string): Promise<string[]> {
    const rows = await db()
      .select({ slug: schema.roles.slug })
      .from(schema.userRoles)
      .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
      .where(eq(schema.userRoles.userId, userId));
    return rows.map((r) => r.slug);
  },

  /** Full role rows assigned to a user (for admin UI + power checks). */
  async getUserRoles(userId: string) {
    return db()
      .select({
        id: schema.roles.id,
        slug: schema.roles.slug,
        name: schema.roles.name,
        power: schema.roles.power,
        isSystem: schema.roles.isSystem,
      })
      .from(schema.userRoles)
      .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
      .where(eq(schema.userRoles.userId, userId));
  },

  async getUserPower(userId: string): Promise<number> {
    const roles = await this.getUserRoles(userId);
    if (roles.length === 0) return 0;
    return Math.max(...roles.map((r) => r.power));
  },

  /**
   * Effective permission bitmask = bitwise OR of every role's mask. Computed in
   * the database with `bit_or` for efficiency.
   */
  async getEffectivePermissions(userId: string): Promise<{ roles: string[]; mask: bigint }> {
    const rows = await db()
      .select({ slug: schema.roles.slug, permissions: schema.roles.permissions })
      .from(schema.userRoles)
      .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
      .where(eq(schema.userRoles.userId, userId));
    const mask = rows.reduce((acc, r) => acc | r.permissions, 0n);
    return { roles: rows.map((r) => r.slug), mask };
  },

  async assignRole(userId: string, roleId: string, assignedBy?: string): Promise<void> {
    await db()
      .insert(schema.userRoles)
      .values({ userId, roleId, assignedBy: assignedBy ?? null })
      .onConflictDoNothing();
  },

  async removeRole(userId: string, roleId: string): Promise<void> {
    await db()
      .delete(schema.userRoles)
      .where(and(eq(schema.userRoles.userId, userId), eq(schema.userRoles.roleId, roleId)));
  },

  /** Replace the user's role set with the given role IDs. */
  async setUserRoles(userId: string, roleIds: string[], assignedBy: string): Promise<void> {
    await db().delete(schema.userRoles).where(eq(schema.userRoles.userId, userId));
    if (roleIds.length === 0) return;
    await db()
      .insert(schema.userRoles)
      .values(roleIds.map((roleId) => ({ userId, roleId, assignedBy })));
  },

  async list(params: { limit: number; offset: number; search?: string }) {
    const conditions = [isNull(schema.users.deletedAt)];
    if (params.search) {
      const term = `%${params.search}%`;
      conditions.push(or(ilike(schema.users.name, term), ilike(schema.users.email, term))!);
    }
    const where = and(...conditions);
    const [items, [{ total } = { total: 0 }]] = await Promise.all([
      db()
        .select()
        .from(schema.users)
        .where(where)
        .orderBy(desc(schema.users.createdAt))
        .limit(params.limit)
        .offset(params.offset),
      db().select({ total: sql<number>`count(*)::int` }).from(schema.users).where(where),
    ]);
    return { items, total };
  },
};
