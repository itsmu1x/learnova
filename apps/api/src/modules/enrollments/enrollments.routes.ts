import { Router } from 'express';
import { z } from 'zod';
import { Permission } from '@learnova/shared';
import { asyncHandler } from '../../core/http/async-handler.js';
import { authenticate } from '../../core/middleware/authenticate.js';
import { authorize } from '../../core/middleware/authorize.js';
import { validate } from '../../core/middleware/validate.js';
import { sendOk } from '../../core/http/responses.js';
import { enrollmentsService } from './enrollments.service.js';

export const enrollmentsRouter: Router = Router();

enrollmentsRouter.use(authenticate);

enrollmentsRouter.get(
  '/',
  asyncHandler(async (req, res) => sendOk(res, await enrollmentsService.myEnrollments(req.user!.id))),
);

enrollmentsRouter.get(
  '/continue',
  asyncHandler(async (req, res) => sendOk(res, await enrollmentsService.continueLearning(req.user!.id))),
);

enrollmentsRouter.post(
  '/:courseId',
  authorize(Permission.ENROLL_COURSE),
  asyncHandler(async (req, res) =>
    sendOk(res, await enrollmentsService.enroll(req.user!.id, req.params.courseId!), 201),
  ),
);

enrollmentsRouter.get(
  '/:courseId/progress',
  asyncHandler(async (req, res) =>
    sendOk(res, await enrollmentsService.getCourseProgress(req.user!.id, req.params.courseId!)),
  ),
);

enrollmentsRouter.post(
  '/lessons/:lessonId/progress',
  validate({
    body: z.object({
      watchedSeconds: z.number().int().min(0).optional(),
      lastPositionSeconds: z.number().int().min(0).optional(),
      completed: z.boolean().optional(),
    }),
  }),
  asyncHandler(async (req, res) =>
    sendOk(res, await enrollmentsService.updateLessonProgress(req.user!.id, req.params.lessonId!, req.body)),
  ),
);
