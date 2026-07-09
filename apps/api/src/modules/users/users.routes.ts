import { Router } from 'express';
import { Permission } from '@learnova/shared';
import { z } from 'zod';
import { asyncHandler } from '../../core/http/async-handler.js';
import { authenticate } from '../../core/middleware/authenticate.js';
import { authorize } from '../../core/middleware/authorize.js';
import { validate } from '../../core/middleware/validate.js';
import { usersController } from './users.controller.js';

export const usersRouter: Router = Router();

const updateProfileSchema = z.object({
  name: z.string().min(2).max(160).optional(),
  bio: z.string().max(2000).optional(),
  headline: z.string().max(200).optional(),
  avatarUrl: z.string().url().optional(),
});

const adminUpdateSchema = z.object({
  isBanned: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

usersRouter.use(authenticate);

// Self-service
usersRouter.get('/me', asyncHandler(usersController.me));
usersRouter.patch('/me', validate({ body: updateProfileSchema }), asyncHandler(usersController.updateMe));

// Admin
usersRouter.get('/', authorize(Permission.VIEW_USERS), asyncHandler(usersController.list));
usersRouter.get('/:id', authorize(Permission.VIEW_USERS), asyncHandler(usersController.get));
usersRouter.patch(
  '/:id',
  authorize(Permission.MANAGE_USERS),
  validate({ body: adminUpdateSchema }),
  asyncHandler(usersController.adminUpdate),
);
usersRouter.post(
  '/:id/promote-instructor',
  authorize(Permission.CREATE_INSTRUCTOR),
  asyncHandler(usersController.promote),
);
usersRouter.delete('/:id', authorize(Permission.MANAGE_USERS), asyncHandler(usersController.remove));
