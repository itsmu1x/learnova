import { Router } from 'express';
import { Permission } from '@learnova/shared';
import { asyncHandler } from '../../core/http/async-handler.js';
import { authenticate } from '../../core/middleware/authenticate.js';
import { authorize } from '../../core/middleware/authorize.js';
import { sendOk } from '../../core/http/responses.js';
import { analyticsService } from './analytics.service.js';

export const analyticsRouter: Router = Router();

analyticsRouter.use(authenticate);

analyticsRouter.get(
  '/instructor',
  authorize(Permission.VIEW_ANALYTICS),
  asyncHandler(async (req, res) => sendOk(res, await analyticsService.instructorOverview(req.user!.id))),
);

analyticsRouter.get(
  '/admin',
  authorize(Permission.VIEW_ADMIN_PANEL),
  asyncHandler(async (_req, res) => sendOk(res, await analyticsService.adminOverview())),
);
