import { Router } from 'express';
import { z } from 'zod';
import { schema, asc, eq, ne, isNull, and, sql } from '@learnova/database';
import { Permission, slugify, ConflictError, NotFoundError } from '@learnova/shared';
import { db } from '../../core/database.js';
import { asyncHandler } from '../../core/http/async-handler.js';
import { authenticate } from '../../core/middleware/authenticate.js';
import { authorize } from '../../core/middleware/authorize.js';
import { validate } from '../../core/middleware/validate.js';
import { sendOk } from '../../core/http/responses.js';
import { recordAudit } from '../audit/audit.service.js';

export const categoriesRouter: Router = Router();

const upsertSchema = z.object({
  name: z.string().min(2).max(160),
  description: z.string().max(500).optional(),
  icon: z.string().max(64).optional(),
});

/** Public catalog list (course filters, marketing). */
categoriesRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const rows = await db()
      .select({
        id: schema.categories.id,
        slug: schema.categories.slug,
        name: schema.categories.name,
        description: schema.categories.description,
        icon: schema.categories.icon,
        courseCount: sql<number>`count(${schema.courses.id})::int`,
      })
      .from(schema.categories)
      .leftJoin(
        schema.courses,
        and(eq(schema.courses.categoryId, schema.categories.id), eq(schema.courses.status, 'published')),
      )
      .where(isNull(schema.categories.deletedAt))
      .groupBy(schema.categories.id)
      .orderBy(asc(schema.categories.name));
    sendOk(res, rows);
  }),
);

/**
 * Instructor/admin management list — gated by VIEW_CATEGORIES.
 * Includes all courses (not only published) in the count.
 */
categoriesRouter.get(
  '/manage',
  authenticate,
  authorize(Permission.VIEW_CATEGORIES),
  asyncHandler(async (_req, res) => {
    const rows = await db()
      .select({
        id: schema.categories.id,
        slug: schema.categories.slug,
        name: schema.categories.name,
        description: schema.categories.description,
        icon: schema.categories.icon,
        courseCount: sql<number>`count(${schema.courses.id})::int`,
        createdAt: schema.categories.createdAt,
        updatedAt: schema.categories.updatedAt,
      })
      .from(schema.categories)
      .leftJoin(
        schema.courses,
        and(eq(schema.courses.categoryId, schema.categories.id), isNull(schema.courses.deletedAt)),
      )
      .where(isNull(schema.categories.deletedAt))
      .groupBy(schema.categories.id)
      .orderBy(asc(schema.categories.name));
    sendOk(res, rows);
  }),
);

categoriesRouter.post(
  '/',
  authenticate,
  authorize(Permission.MANAGE_CATEGORIES),
  validate({ body: upsertSchema }),
  asyncHandler(async (req, res) => {
    const slug = slugify(req.body.name);
    const [existing] = await db()
      .select()
      .from(schema.categories)
      .where(and(eq(schema.categories.slug, slug), isNull(schema.categories.deletedAt)))
      .limit(1);
    if (existing) throw new ConflictError('Category already exists');

    // Revive a soft-deleted category with the same slug if present.
    const [softDeleted] = await db()
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.slug, slug))
      .limit(1);

    let row;
    if (softDeleted?.deletedAt) {
      [row] = await db()
        .update(schema.categories)
        .set({
          name: req.body.name,
          description: req.body.description ?? null,
          icon: req.body.icon ?? null,
          deletedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(schema.categories.id, softDeleted.id))
        .returning();
    } else {
      [row] = await db()
        .insert(schema.categories)
        .values({ ...req.body, slug })
        .returning();
    }

    await recordAudit({
      actorId: req.user!.id,
      action: 'category.create',
      entityType: 'category',
      entityId: row!.id,
    });
    sendOk(res, row, 201);
  }),
);

categoriesRouter.patch(
  '/:id',
  authenticate,
  authorize(Permission.MANAGE_CATEGORIES),
  validate({ body: upsertSchema.partial() }),
  asyncHandler(async (req, res) => {
    const [current] = await db()
      .select()
      .from(schema.categories)
      .where(and(eq(schema.categories.id, req.params.id!), isNull(schema.categories.deletedAt)))
      .limit(1);
    if (!current) throw new NotFoundError('Category not found');

    const patch: Record<string, unknown> = { ...req.body, updatedAt: new Date() };
    if (typeof req.body.name === 'string' && req.body.name !== current.name) {
      const slug = slugify(req.body.name);
      const [clash] = await db()
        .select()
        .from(schema.categories)
        .where(
          and(
            eq(schema.categories.slug, slug),
            isNull(schema.categories.deletedAt),
            ne(schema.categories.id, current.id),
          ),
        )
        .limit(1);
      if (clash) throw new ConflictError('Another category already uses this name');
      patch.slug = slug;
    }

    const [row] = await db()
      .update(schema.categories)
      .set(patch)
      .where(eq(schema.categories.id, current.id))
      .returning();

    await recordAudit({
      actorId: req.user!.id,
      action: 'category.update',
      entityType: 'category',
      entityId: row!.id,
    });
    sendOk(res, row);
  }),
);

categoriesRouter.delete(
  '/:id',
  authenticate,
  authorize(Permission.MANAGE_CATEGORIES),
  asyncHandler(async (req, res) => {
    const [current] = await db()
      .select()
      .from(schema.categories)
      .where(and(eq(schema.categories.id, req.params.id!), isNull(schema.categories.deletedAt)))
      .limit(1);
    if (!current) throw new NotFoundError('Category not found');

    await db()
      .update(schema.categories)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.categories.id, current.id));

    await recordAudit({
      actorId: req.user!.id,
      action: 'category.delete',
      entityType: 'category',
      entityId: current.id,
    });
    sendOk(res, { deleted: true });
  }),
);
