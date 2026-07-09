import { Router } from 'express';
import { Permission, toPageMeta } from '@learnova/shared';
import { asyncHandler } from '../../core/http/async-handler.js';
import { authenticate } from '../../core/middleware/authenticate.js';
import { authorize } from '../../core/middleware/authorize.js';
import { sendOk } from '../../core/http/responses.js';
import { resolvePage } from '../../utils/pagination.js';
import { listAuditLogs } from './audit.service.js';

export const auditRouter: Router = Router();

auditRouter.use(authenticate, authorize(Permission.VIEW_AUDIT_LOGS));

auditRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, offset } = resolvePage(req.query as never);
    const { items, total } = await listAuditLogs({
      page,
      limit,
      offset,
      entityType: (req.query.entityType as string) || undefined,
      actorId: (req.query.actorId as string) || undefined,
    });
    sendOk(res, items, 200, toPageMeta(total, page, limit));
  }),
);
