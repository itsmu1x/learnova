import { Router } from 'express';
import { PERMISSION_CATALOG, Permission } from '@learnova/shared';
import { authenticate } from '../../core/middleware/authenticate.js';
import { authorize } from '../../core/middleware/authorize.js';
import { sendOk } from '../../core/http/responses.js';

export const permissionsRouter: Router = Router();

permissionsRouter.use(authenticate);

/** Returns the full permission catalog with metadata for the admin UI. */
permissionsRouter.get('/', authorize(Permission.VIEW_PERMISSIONS), (_req, res) => {
  sendOk(
    res,
    PERMISSION_CATALOG.map((p) => ({
      key: p.key,
      label: p.label,
      description: p.description,
      category: p.category,
      kind: p.kind,
      bit: p.bit.toString(),
    })),
  );
});
