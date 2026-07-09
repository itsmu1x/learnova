import { schema, desc, eq, and, sql } from '@learnova/database';
import { db } from '../../core/database.js';
import { logger } from '../../core/logger.js';

export interface AuditEntry {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  previousData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Records an audit entry. Failures are swallowed (logged) so auditing never
 * breaks the primary operation.
 */
export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    await db()
      .insert(schema.auditLogs)
      .values({
        actorId: entry.actorId ?? null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        previousData: entry.previousData ?? null,
        newData: entry.newData ?? null,
        ipAddress: entry.ipAddress ?? null,
        userAgent: entry.userAgent?.slice(0, 500) ?? null,
      });
  } catch (error) {
    logger.error('Failed to write audit log', { action: entry.action, error });
  }
}

export async function listAuditLogs(params: {
  page: number;
  limit: number;
  offset: number;
  entityType?: string;
  actorId?: string;
}) {
  const conditions = [];
  if (params.entityType) conditions.push(eq(schema.auditLogs.entityType, params.entityType));
  if (params.actorId) conditions.push(eq(schema.auditLogs.actorId, params.actorId));
  const where = conditions.length ? and(...conditions) : undefined;

  const [items, [{ total } = { total: 0 }]] = await Promise.all([
    db()
      .select()
      .from(schema.auditLogs)
      .where(where)
      .orderBy(desc(schema.auditLogs.createdAt))
      .limit(params.limit)
      .offset(params.offset),
    db()
      .select({ total: sql<number>`count(*)::int` })
      .from(schema.auditLogs)
      .where(where),
  ]);

  return { items, total };
}
