import { Router } from 'express';
import { z } from 'zod';
import { Permission, toPageMeta } from '@learnova/shared';
import { asyncHandler } from '../../core/http/async-handler.js';
import { authenticate } from '../../core/middleware/authenticate.js';
import { authorize } from '../../core/middleware/authorize.js';
import { validate } from '../../core/middleware/validate.js';
import { sendOk } from '../../core/http/responses.js';
import { resolvePage } from '../../utils/pagination.js';
import { paymentsService } from './payments.service.js';

export const paymentsRouter: Router = Router();

paymentsRouter.use(authenticate);

paymentsRouter.post(
  '/checkout/course/:courseId',
  validate({
    body: z
      .object({
        client: z.enum(['web', 'mobile']).optional(),
      })
      .default({}),
  }),
  asyncHandler(async (req, res) =>
    sendOk(
      res,
      await paymentsService.checkoutCourse(
        { id: req.user!.id, email: req.user!.email },
        req.params.courseId!,
        { client: req.body?.client },
      ),
    ),
  ),
);

paymentsRouter.post(
  '/checkout/subscription',
  asyncHandler(async (req, res) =>
    sendOk(res, await paymentsService.checkoutSubscription({ id: req.user!.id, email: req.user!.email })),
  ),
);

paymentsRouter.get(
  '/subscription',
  asyncHandler(async (req, res) => sendOk(res, await paymentsService.mySubscription(req.user!.id))),
);

paymentsRouter.post(
  '/subscription/cancel',
  asyncHandler(async (req, res) => sendOk(res, await paymentsService.cancelSubscription(req.user!.id))),
);

paymentsRouter.get(
  '/history',
  asyncHandler(async (req, res) => sendOk(res, await paymentsService.history(req.user!.id))),
);

// --- Admin ---
paymentsRouter.get(
  '/',
  authorize(Permission.VIEW_PAYMENTS),
  asyncHandler(async (req, res) => {
    const { page, limit, offset } = resolvePage(req.query as never);
    const { items, total } = await paymentsService.listAll({ limit, offset });
    sendOk(res, items, 200, toPageMeta(total, page, limit));
  }),
);

paymentsRouter.post(
  '/:id/refund',
  authorize(Permission.MANAGE_PAYMENTS),
  asyncHandler(async (req, res) => sendOk(res, await paymentsService.refund(req.user!.id, req.params.id!))),
);
