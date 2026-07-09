import { Router } from 'express';
import { z } from 'zod';
import { Permission } from '@learnova/shared';
import { asyncHandler } from '../../core/http/async-handler.js';
import { authenticate } from '../../core/middleware/authenticate.js';
import { authorize } from '../../core/middleware/authorize.js';
import { validate } from '../../core/middleware/validate.js';
import { sendOk } from '../../core/http/responses.js';
import { videosService } from './videos.service.js';

export const videosRouter: Router = Router();

function actor(req: { user?: { id: string; permissions: bigint } }) {
  return { id: req.user!.id, permissions: req.user!.permissions };
}

videosRouter.use(authenticate);

videosRouter.post(
  '/:lessonId/upload-init',
  authorize(Permission.UPLOAD_VIDEO),
  validate({ body: z.object({ title: z.string().min(1).max(220) }) }),
  asyncHandler(async (req, res) =>
    sendOk(res, await videosService.initUpload(actor(req), req.params.lessonId!, req.body.title)),
  ),
);

videosRouter.post(
  '/:lessonId/complete',
  authorize(Permission.UPLOAD_VIDEO),
  validate({ body: z.object({ durationSeconds: z.number().int().min(0).optional() }) }),
  asyncHandler(async (req, res) =>
    sendOk(res, await videosService.markProcessing(actor(req), req.params.lessonId!, req.body.durationSeconds)),
  ),
);

videosRouter.get(
  '/:lessonId/status',
  authorize(Permission.UPLOAD_VIDEO),
  asyncHandler(async (req, res) => sendOk(res, await videosService.syncStatus(actor(req), req.params.lessonId!))),
);

videosRouter.get(
  '/:lessonId/playback',
  asyncHandler(async (req, res) => sendOk(res, await videosService.getPlayback(actor(req), req.params.lessonId!))),
);
