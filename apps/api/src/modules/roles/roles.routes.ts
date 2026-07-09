import { Router } from 'express';
import { z } from 'zod';
import { Permission, PERMISSION_CATALOG } from '@learnova/shared';
import { asyncHandler } from '../../core/http/async-handler.js';
import { authenticate } from '../../core/middleware/authenticate.js';
import { authorize } from '../../core/middleware/authorize.js';
import { validate } from '../../core/middleware/validate.js';
import { sendOk } from '../../core/http/responses.js';
import { rolesService } from './roles.service.js';

export const rolesRouter: Router = Router();

const permissionKeys = PERMISSION_CATALOG.map((p) => p.key) as [string, ...string[]];
const permissionKeyEnum = z.enum(permissionKeys);

const createSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  permissionKeys: z.array(permissionKeyEnum).default([]),
});

const updateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(500).optional(),
  permissionKeys: z.array(permissionKeyEnum).optional(),
});

rolesRouter.use(authenticate);

rolesRouter.get(
  '/',
  authorize(Permission.VIEW_ROLES),
  asyncHandler(async (_req, res) => sendOk(res, await rolesService.list())),
);

rolesRouter.get(
  '/:id',
  authorize(Permission.VIEW_ROLES),
  asyncHandler(async (req, res) => sendOk(res, await rolesService.get(req.params.id!))),
);

rolesRouter.post(
  '/',
  authorize(Permission.MANAGE_ROLES),
  validate({ body: createSchema }),
  asyncHandler(async (req, res) =>
    sendOk(res, await rolesService.create(req.user!.id, req.body), 201),
  ),
);

rolesRouter.patch(
  '/:id',
  authorize([Permission.MANAGE_ROLES, Permission.MANAGE_PERMISSIONS], 'any'),
  validate({ body: updateSchema }),
  asyncHandler(async (req, res) =>
    sendOk(res, await rolesService.update(req.user!.id, req.params.id!, req.body)),
  ),
);

rolesRouter.delete(
  '/:id',
  authorize(Permission.MANAGE_ROLES),
  asyncHandler(async (req, res) => {
    await rolesService.remove(req.user!.id, req.params.id!);
    sendOk(res, { deleted: true });
  }),
);
