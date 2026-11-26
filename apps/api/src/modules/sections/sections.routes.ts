import { Router } from 'express';
import { z } from 'zod';
import { schema, and, eq, isNull, sql } from '@learnova/database';
import { Permission, NotFoundError } from '@learnova/shared';
import { db } from '../../core/database.js';
import { asyncHandler } from '../../core/http/async-handler.js';
import { authenticate } from '../../core/middleware/authenticate.js';
import { authorize } from '../../core/middleware/authorize.js';
import { validate } from '../../core/middleware/validate.js';
import { sendOk } from '../../core/http/responses.js';
import { coursesService } from '../courses/courses.service.js';
import { coursesRepository } from '../courses/courses.repository.js';

export const sectionsRouter: Router = Router();

const createSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string().min(2).max(220),
  description: z.string().max(1000).optional(),
});

const reorderSchema = z.object({
  courseId: z.string().uuid(),
  orderedIds: z.array(z.string().uuid()),
});

sectionsRouter.use(authenticate, authorize(Permission.MANAGE_LESSONS));

function actor(req: { user?: { id: string; permissions: bigint } }) {
  return { id: req.user!.id, permissions: req.user!.permissions };
}

sectionsRouter.post(
  '/',
  validate({ body: createSchema }),
  asyncHandler(async (req, res) => {
    await coursesService.assertOwnership(actor(req), req.body.courseId);
    const [{ maxPos } = { maxPos: -1 }] = await db()
      .select({ maxPos: sql<number>`coalesce(max(${schema.sections.position}), -1)::int` })
      .from(schema.sections)
      .where(eq(schema.sections.courseId, req.body.courseId));
    const [row] = await db()
      .insert(schema.sections)
      .values({ ...req.body, position: maxPos + 1 })
      .returning();
    sendOk(res, row, 201);
  }),
);

sectionsRouter.patch(
  '/:id',
  validate({ body: createSchema.pick({ title: true, description: true }).partial() }),
  asyncHandler(async (req, res) => {
    const [section] = await db()
      .select()
      .from(schema.sections)
      .where(and(eq(schema.sections.id, req.params.id!), isNull(schema.sections.deletedAt)))
      .limit(1);
    if (!section) throw new NotFoundError('Section not found');
    await coursesService.assertOwnership(actor(req), section.courseId);
    const [row] = await db()
      .update(schema.sections)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(schema.sections.id, req.params.id!))
      .returning();
    sendOk(res, row);
  }),
);

sectionsRouter.post(
  '/reorder',
  validate({ body: reorderSchema }),
  asyncHandler(async (req, res) => {
    const { courseId, orderedIds } = req.body as z.infer<typeof reorderSchema>;
    await coursesService.assertOwnership(actor(req), courseId);
    for (let i = 0; i < orderedIds.length; i++) {
      // Scoped to the owned course so ids from someone else's course are ignored.
      await db()
        .update(schema.sections)
        .set({ position: i, updatedAt: new Date() })
        .where(and(eq(schema.sections.id, orderedIds[i]!), eq(schema.sections.courseId, courseId)));
    }
    sendOk(res, { reordered: true });
  }),
);

sectionsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const [section] = await db()
      .select()
      .from(schema.sections)
      .where(and(eq(schema.sections.id, req.params.id!), isNull(schema.sections.deletedAt)))
      .limit(1);
    if (!section) throw new NotFoundError('Section not found');
    await coursesService.assertOwnership(actor(req), section.courseId);
    const now = new Date();
    await db().update(schema.sections).set({ deletedAt: now }).where(eq(schema.sections.id, section.id));
    await db().update(schema.lessons).set({ deletedAt: now }).where(eq(schema.lessons.sectionId, section.id));
    // Lesson count / duration shown on course cards must drop with the deleted lessons.
    await coursesRepository.recomputeCounts(section.courseId);
    sendOk(res, { deleted: true });
  }),
);
