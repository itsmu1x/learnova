import type { Request, Response } from 'express';
import { toPageMeta } from '@learnova/shared';
import { sendOk } from '../../core/http/responses.js';
import { resolvePage } from '../../utils/pagination.js';
import { usersService } from './users.service.js';

export const usersController = {
  async me(req: Request, res: Response): Promise<void> {
    sendOk(res, await usersService.getProfile(req.user!.id));
  },

  async updateMe(req: Request, res: Response): Promise<void> {
    sendOk(res, await usersService.updateProfile(req.user!.id, req.body));
  },

  async list(req: Request, res: Response): Promise<void> {
    const { page, limit, offset } = resolvePage(req.query as never);
    const search = (req.query.search as string) || undefined;
    const { items, total } = await usersService.list({ limit, offset, search });
    sendOk(res, items, 200, toPageMeta(total, page, limit));
  },

  async get(req: Request, res: Response): Promise<void> {
    sendOk(res, await usersService.getProfile(req.params.id!));
  },

  async adminUpdate(req: Request, res: Response): Promise<void> {
    sendOk(res, await usersService.adminUpdate(req.user!.id, req.params.id!, req.body));
  },

  async promote(req: Request, res: Response): Promise<void> {
    sendOk(res, await usersService.promoteToInstructor(req.user!.id, req.params.id!));
  },

  async setRoles(req: Request, res: Response): Promise<void> {
    sendOk(res, await usersService.setRoles(req.user!.id, req.params.id!, req.body.roleIds));
  },

  async remove(req: Request, res: Response): Promise<void> {
    await usersService.remove(req.user!.id, req.params.id!);
    sendOk(res, { deleted: true });
  },
};
