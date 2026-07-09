import { Router } from 'express';
import { z } from 'zod';
import { Permission, toPageMeta } from '@learnova/shared';
import { asyncHandler } from '../../core/http/async-handler.js';
import { authenticate, optionalAuth } from '../../core/middleware/authenticate.js';
import { authorize } from '../../core/middleware/authorize.js';
import { validate } from '../../core/middleware/validate.js';
import { sendOk } from '../../core/http/responses.js';
import { resolvePage } from '../../utils/pagination.js';
import { reviewsService } from './reviews.service.js';

export const reviewsRouter: Router = Router();

reviewsRouter.get(
  '/course/:courseId',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { page, limit, offset } = resolvePage(req.query as never);
    const { items, total } = await reviewsService.listForCourse(req.params.courseId!, { limit, offset });
    sendOk(res, items, 200, toPageMeta(total, page, limit));
  }),
);

reviewsRouter.post(
  '/course/:courseId',
  authenticate,
  authorize(Permission.WRITE_REVIEW),
  validate({
    body: z.object({
      rating: z.number().int().min(1).max(5),
      title: z.string().max(220).optional(),
      body: z.string().max(4000).optional(),
    }),
  }),
  asyncHandler(async (req, res) =>
    sendOk(res, await reviewsService.upsert(req.user!.id, req.params.courseId!, req.body), 201),
  ),
);

reviewsRouter.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    await reviewsService.remove(req.user!.id, req.params.id!);
    sendOk(res, { deleted: true });
  }),
);

reviewsRouter.post(
  '/:id/moderate',
  authenticate,
  authorize(Permission.MODERATE_REVIEWS),
  validate({ body: z.object({ isHidden: z.boolean() }) }),
  asyncHandler(async (req, res) => {
    await reviewsService.moderate(req.user!.id, req.params.id!, req.body.isHidden);
    sendOk(res, { moderated: true });
  }),
);
