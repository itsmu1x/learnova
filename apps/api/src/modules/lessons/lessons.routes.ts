import { Router } from 'express';
import { z } from 'zod';
import { Permission } from '@learnova/shared';
import { asyncHandler } from '../../core/http/async-handler.js';
import { authenticate } from '../../core/middleware/authenticate.js';
import { authorize } from '../../core/middleware/authorize.js';
import { validate } from '../../core/middleware/validate.js';
import { sendOk } from '../../core/http/responses.js';
import { lessonsService } from './lessons.service.js';

export const lessonsRouter: Router = Router();

function actor(req: { user?: { id: string; permissions: bigint } }) {
  return { id: req.user!.id, permissions: req.user!.permissions };
}

const createSchema = z.object({
  sectionId: z.string().uuid(),
  courseId: z.string().uuid(),
  title: z.string().min(2).max(220),
  isPreview: z.boolean().optional(),
});

const updateSchema = z.object({
  title: z.string().min(2).max(220).optional(),
  description: z.string().max(4000).optional(),
  transcript: z.string().max(50000).optional(),
  isPreview: z.boolean().optional(),
  durationSeconds: z.number().int().min(0).optional(),
});

lessonsRouter.use(authenticate);

lessonsRouter.get('/:id', asyncHandler(async (req, res) => sendOk(res, await lessonsService.getFull(req.params.id!))));

lessonsRouter.post(
  '/',
  authorize(Permission.MANAGE_LESSONS),
  validate({ body: createSchema }),
  asyncHandler(async (req, res) => sendOk(res, await lessonsService.create(actor(req), req.body), 201)),
);

lessonsRouter.patch(
  '/:id',
  authorize(Permission.MANAGE_LESSONS),
  validate({ body: updateSchema }),
  asyncHandler(async (req, res) => sendOk(res, await lessonsService.update(actor(req), req.params.id!, req.body))),
);

lessonsRouter.delete(
  '/:id',
  authorize(Permission.MANAGE_LESSONS),
  asyncHandler(async (req, res) => {
    await lessonsService.remove(actor(req), req.params.id!);
    sendOk(res, { deleted: true });
  }),
);

lessonsRouter.post(
  '/:id/resources',
  authorize(Permission.MANAGE_LESSONS),
  validate({ body: z.object({ title: z.string().min(1), url: z.string().url(), kind: z.string().optional() }) }),
  asyncHandler(async (req, res) => sendOk(res, await lessonsService.addResource(actor(req), req.params.id!, req.body), 201)),
);

lessonsRouter.post(
  '/:id/ai/summary',
  authorize(Permission.MANAGE_LESSONS),
  asyncHandler(async (req, res) => sendOk(res, await lessonsService.generateSummary(actor(req), req.params.id!))),
);

lessonsRouter.post(
  '/:id/ai/quiz',
  authorize(Permission.MANAGE_LESSONS),
  validate({ body: z.object({ count: z.number().int().min(1).max(15).optional() }) }),
  asyncHandler(async (req, res) =>
    sendOk(res, await lessonsService.generateQuizForLesson(actor(req), req.params.id!, req.body.count)),
  ),
);

lessonsRouter.post(
  '/reorder',
  authorize(Permission.MANAGE_LESSONS),
  validate({ body: z.object({ courseId: z.string().uuid(), orderedIds: z.array(z.string().uuid()) }) }),
  asyncHandler(async (req, res) => {
    await lessonsService.reorder(actor(req), req.body.courseId, req.body.orderedIds);
    sendOk(res, { reordered: true });
  }),
);
