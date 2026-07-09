import { z } from 'zod';
import { PAGINATION } from '@learnova/config';
import { clamp } from '@learnova/shared';

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
});

export interface PageParams {
  page: number;
  limit: number;
}

export function resolvePage(input: Partial<PageParams>): PageParams & { offset: number } {
  const page = Math.max(1, input.page ?? PAGINATION.DEFAULT_PAGE);
  const limit = clamp(input.limit ?? PAGINATION.DEFAULT_LIMIT, 1, PAGINATION.MAX_LIMIT);
  return { page, limit, offset: (page - 1) * limit };
}
