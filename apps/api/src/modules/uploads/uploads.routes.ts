import { Router } from 'express';
import { asyncHandler } from '../../core/http/async-handler.js';
import { authenticate } from '../../core/middleware/authenticate.js';
import { sendOk } from '../../core/http/responses.js';
import { getImageKitAuthParams, isImageKitConfigured } from '../../services/imagekit.service.js';

export const uploadsRouter: Router = Router();

uploadsRouter.use(authenticate);

/** Signed params for direct browser → ImageKit uploads (avatars, thumbnails). */
uploadsRouter.get(
  '/imagekit/auth',
  asyncHandler(async (_req, res) => {
    if (!isImageKitConfigured()) {
      sendOk(res, { configured: false, message: 'ImageKit not configured' });
      return;
    }
    sendOk(res, { configured: true, ...getImageKitAuthParams() });
  }),
);
