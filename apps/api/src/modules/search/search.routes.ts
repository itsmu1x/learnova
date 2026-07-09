import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../core/http/async-handler.js';
import { validate } from '../../core/middleware/validate.js';
import { sendOk } from '../../core/http/responses.js';
import { getSearchProvider } from './search.service.js';

export const searchRouter: Router = Router();

searchRouter.get(
  '/',
  validate({
    query: z.object({
      q: z.string().min(1).max(200),
      limit: z.coerce.number().int().min(1).max(20).default(8),
    }),
  }),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as { q: string; limit: number };
    const results = await getSearchProvider().search(q.q, q.limit);
    sendOk(res, results, 200, { provider: getSearchProvider().kind });
  }),
);
