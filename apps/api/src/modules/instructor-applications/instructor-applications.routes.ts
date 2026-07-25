import { Router } from 'express';
import { z } from 'zod';
import { Permission } from '@learnova/shared';
import { asyncHandler } from '../../core/http/async-handler.js';
import { authenticate } from '../../core/middleware/authenticate.js';
import { authorize } from '../../core/middleware/authorize.js';
import { validate } from '../../core/middleware/validate.js';
import { sendOk } from '../../core/http/responses.js';
import { instructorApplicationsService } from './instructor-applications.service.js';

export const instructorApplicationsRouter: Router = Router();

const reviewSchema = z.object({
  adminNote: z.string().max(2000).optional(),
});

instructorApplicationsRouter.use(authenticate);

instructorApplicationsRouter.get(
  '/',
  authorize(Permission.VIEW_INSTRUCTOR_APPLICATIONS),
  validate({
    query: z.object({
      status: z.enum(['pending', 'approved', 'rejected', 'withdrawn']).optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    sendOk(res, await instructorApplicationsService.list(req.query.status as never));
  }),
);

instructorApplicationsRouter.post(
  '/:id/approve',
  authorize(Permission.MANAGE_INSTRUCTOR_APPLICATIONS),
  validate({ body: reviewSchema }),
  asyncHandler(async (req, res) => {
    sendOk(
      res,
      await instructorApplicationsService.approve(req.user!.id, req.params.id!, req.body.adminNote),
    );
  }),
);

instructorApplicationsRouter.post(
  '/:id/reject',
  authorize(Permission.MANAGE_INSTRUCTOR_APPLICATIONS),
  validate({ body: reviewSchema }),
  asyncHandler(async (req, res) => {
    sendOk(
      res,
      await instructorApplicationsService.reject(req.user!.id, req.params.id!, req.body.adminNote),
    );
  }),
);
