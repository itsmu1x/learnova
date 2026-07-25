import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { authProviderEnum, timestamps, tokenTypeEnum, instructorApplicationStatusEnum } from './_shared.js';

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 320 }).notNull(),
    name: varchar('name', { length: 160 }).notNull(),
    passwordHash: text('password_hash'),
    avatarUrl: text('avatar_url'),
    bio: text('bio'),
    headline: varchar('headline', { length: 200 }),
    provider: authProviderEnum('provider').default('local').notNull(),
    providerId: varchar('provider_id', { length: 191 }),
    emailVerified: boolean('email_verified').default(false).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    isBanned: boolean('is_banned').default(false).notNull(),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => ({
    emailUnique: uniqueIndex('users_email_unique').on(t.email),
    providerIdx: index('users_provider_idx').on(t.provider, t.providerId),
  }),
);

export const roles = pgTable(
  'roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: varchar('slug', { length: 64 }).notNull(),
    name: varchar('name', { length: 120 }).notNull(),
    description: text('description'),
    isSystem: boolean('is_system').default(false).notNull(),
    /** 1–100 authority rank. Higher outranks lower; used for admin hierarchy. */
    power: integer('power').default(10).notNull(),
    // Bitwise permission mask stored as BIGINT.
    permissions: bigint('permissions', { mode: 'bigint' })
      .default(sql`0`)
      .notNull(),
    ...timestamps,
  },
  (t) => ({
    slugUnique: uniqueIndex('roles_slug_unique').on(t.slug),
  }),
);

/**
 * Canonical catalog of every permission bit. Roles carry the actual bitmask;
 * this table exists so the admin UI can render human-readable metadata and so
 * permissions can be documented/audited in the database itself.
 */
export const permissions = pgTable(
  'permissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    key: varchar('key', { length: 64 }).notNull(),
    label: varchar('label', { length: 160 }).notNull(),
    description: text('description'),
    category: varchar('category', { length: 32 }).notNull(),
    kind: varchar('kind', { length: 16 }).notNull(),
    bit: bigint('bit', { mode: 'bigint' }).notNull(),
    ...timestamps,
  },
  (t) => ({
    keyUnique: uniqueIndex('permissions_key_unique').on(t.key),
    bitUnique: uniqueIndex('permissions_bit_unique').on(t.bit),
  }),
);

/** Explicit role→permission join so grants are individually auditable. */
export const rolePermissions = pgTable(
  'role_permissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: uuid('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    unique: uniqueIndex('role_permissions_unique').on(t.roleId, t.permissionId),
  }),
);

export const userRoles = pgTable(
  'user_roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    assignedBy: uuid('assigned_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    unique: uniqueIndex('user_roles_unique').on(t.userId, t.roleId),
  }),
);

/**
 * Auth tokens: refresh tokens (with rotation via `replacedById`), email
 * verification and password reset. Only hashes are stored, never raw tokens.
 */
export const authTokens = pgTable(
  'auth_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: tokenTypeEnum('type').notNull(),
    tokenHash: text('token_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    replacedById: uuid('replaced_by_id'),
    userAgent: text('user_agent'),
    ipAddress: varchar('ip_address', { length: 64 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    hashIdx: index('auth_tokens_hash_idx').on(t.tokenHash),
    userTypeIdx: index('auth_tokens_user_type_idx').on(t.userId, t.type),
  }),
);

/**
 * Students apply to teach; admins review and approve/reject.
 * On approve, the applicant is granted the instructor role.
 */
export const instructorApplications = pgTable(
  'instructor_applications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: instructorApplicationStatusEnum('status').default('pending').notNull(),
    /** Display name at time of application (may update profile too). */
    fullName: varchar('full_name', { length: 160 }).notNull(),
    headline: varchar('headline', { length: 200 }),
    bio: text('bio'),
    expertise: text('expertise').notNull(),
    motivation: text('motivation').notNull(),
    experienceYears: integer('experience_years'),
    portfolioUrl: text('portfolio_url'),
    linkedinUrl: text('linkedin_url'),
    certificateUrl: text('certificate_url'),
    certificateFileName: varchar('certificate_file_name', { length: 255 }),
    adminNote: text('admin_note'),
    reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => ({
    userIdx: index('instructor_applications_user_idx').on(t.userId),
    statusIdx: index('instructor_applications_status_idx').on(t.status),
  }),
);
