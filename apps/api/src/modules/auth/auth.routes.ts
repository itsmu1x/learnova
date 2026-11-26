import { Router } from 'express';
import { asyncHandler } from '../../core/http/async-handler.js';
import { authenticate } from '../../core/middleware/authenticate.js';
import { authRateLimiter } from '../../core/middleware/rate-limit.js';
import { validate } from '../../core/middleware/validate.js';
import { sendOk } from '../../core/http/responses.js';
import { authController } from './auth.controller.js';
import { authService } from './auth.service.js';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerInstructorSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from './auth.validators.js';

export const authRouter: Router = Router();

authRouter.post(
  '/register',
  authRateLimiter,
  validate({ body: registerSchema }),
  asyncHandler(authController.register),
);
authRouter.post(
  '/register-instructor',
  authRateLimiter,
  validate({ body: registerInstructorSchema }),
  asyncHandler(authController.registerInstructor),
);
authRouter.post(
  '/login',
  authRateLimiter,
  validate({ body: loginSchema }),
  asyncHandler(authController.login),
);
authRouter.post('/refresh', asyncHandler(authController.refresh));
authRouter.post('/logout', asyncHandler(authController.logout));
authRouter.get('/me', authenticate, asyncHandler(authController.me));
authRouter.post(
  '/change-password',
  authenticate,
  authRateLimiter,
  validate({ body: changePasswordSchema }),
  asyncHandler(async (req, res) => {
    await authService.changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword);
    sendOk(res, { changed: true });
  }),
);

authRouter.post(
  '/verify-email',
  validate({ body: verifyEmailSchema }),
  asyncHandler(authController.verifyEmail),
);
authRouter.post(
  '/forgot-password',
  authRateLimiter,
  validate({ body: forgotPasswordSchema }),
  asyncHandler(authController.forgotPassword),
);
authRouter.post(
  '/reset-password',
  validate({ body: resetPasswordSchema }),
  asyncHandler(authController.resetPassword),
);

// OAuth
authRouter.get('/oauth/google', authController.googleRedirect);
authRouter.get('/oauth/google/callback', asyncHandler(authController.googleCallback));
authRouter.get('/oauth/github', authController.githubRedirect);
authRouter.get('/oauth/github/callback', asyncHandler(authController.githubCallback));
