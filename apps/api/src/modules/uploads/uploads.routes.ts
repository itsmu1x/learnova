import { Router } from 'express';
import { asyncHandler } from '../../core/http/async-handler.js';
import { optionalAuth } from '../../core/middleware/authenticate.js';
import { authRateLimiter } from '../../core/middleware/rate-limit.js';
import { sendOk } from '../../core/http/responses.js';
import { getImageKitAuthParams, isImageKitConfigured } from '../../services/imagekit.service.js';

export const uploadsRouter: Router = Router();

/**
 * Signed params for direct browser → ImageKit uploads.
 * Auth is optional so instructor signup can attach a credential before login.
 */
uploadsRouter.get(
  '/imagekit/auth',
  authRateLimiter,
  optionalAuth,
  asyncHandler(async (_req, res) => {
    if (!isImageKitConfigured()) {
      sendOk(res, { configured: false, message: 'ImageKit not configured' });
      return;
    }
    sendOk(res, { configured: true, ...getImageKitAuthParams() });
  }),
);
