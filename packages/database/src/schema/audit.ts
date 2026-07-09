import { index, jsonb, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from './auth.js';

/**
 * Immutable audit trail. Captures who did what to which entity, together with a
 * before/after snapshot so admins can review every sensitive mutation.
 */
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    action: varchar('action', { length: 120 }).notNull(),
    entityType: varchar('entity_type', { length: 64 }).notNull(),
    entityId: varchar('entity_id', { length: 191 }),
    previousData: jsonb('previous_data').$type<Record<string, unknown> | null>(),
    newData: jsonb('new_data').$type<Record<string, unknown> | null>(),
    ipAddress: varchar('ip_address', { length: 64 }),
    userAgent: varchar('user_agent', { length: 512 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    actorIdx: index('audit_logs_actor_idx').on(t.actorId),
    entityIdx: index('audit_logs_entity_idx').on(t.entityType, t.entityId),
    createdIdx: index('audit_logs_created_idx').on(t.createdAt),
  }),
);
