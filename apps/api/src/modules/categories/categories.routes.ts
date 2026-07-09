import { Router } from 'express';
import { z } from 'zod';
import { schema, asc, eq, isNull, and, sql } from '@learnova/database';
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
      .where(eq(schema.categories.slug, slug))
      .limit(1);
    if (existing) throw new ConflictError('Category already exists');
    const [row] = await db()
      .insert(schema.categories)
      .values({ ...req.body, slug })
      .returning();
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
    const [row] = await db()
      .update(schema.categories)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(schema.categories.id, req.params.id!))
      .returning();
    if (!row) throw new NotFoundError('Category not found');
    sendOk(res, row);
  }),
);

categoriesRouter.delete(
  '/:id',
  authenticate,
  authorize(Permission.MANAGE_CATEGORIES),
  asyncHandler(async (req, res) => {
    await db()
      .update(schema.categories)
      .set({ deletedAt: new Date() })
      .where(eq(schema.categories.id, req.params.id!));
    sendOk(res, { deleted: true });
  }),
);
