import { Router } from 'express';
import { asyncHandler } from '../../core/http/async-handler.js';
import { authenticate } from '../../core/middleware/authenticate.js';
import { sendOk } from '../../core/http/responses.js';
import { certificatesService } from './certificates.service.js';

export const certificatesRouter: Router = Router();

// Public verification (no auth)
certificatesRouter.get(
  '/verify/:code',
  asyncHandler(async (req, res) => sendOk(res, await certificatesService.verify(req.params.code!))),
);

certificatesRouter.get(
  '/:code/download',
  asyncHandler(async (req, res) => {
    const pdf = await certificatesService.renderPdf(req.params.code!);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="learnova-${req.params.code}.pdf"`);
    res.send(pdf);
  }),
);

// Authenticated: my certificates
certificatesRouter.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => sendOk(res, await certificatesService.listForUser(req.user!.id))),
);
