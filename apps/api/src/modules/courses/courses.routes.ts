import { Router } from 'express';
import { z } from 'zod';
import { CourseStatus, Permission, toPageMeta } from '@learnova/shared';
import { asyncHandler } from '../../core/http/async-handler.js';
import { authenticate, optionalAuth } from '../../core/middleware/authenticate.js';
import { authorize } from '../../core/middleware/authorize.js';
import { validate } from '../../core/middleware/validate.js';
import { sendOk } from '../../core/http/responses.js';
import { resolvePage } from '../../utils/pagination.js';
import { coursesService } from './courses.service.js';

export const coursesRouter: Router = Router();

const browseQuery = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  category: z.string().optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  minPrice: z.coerce.number().int().optional(),
  maxPrice: z.coerce.number().int().optional(),
  isPro: z.coerce.boolean().optional(),
  sort: z.enum(['newest', 'popular', 'rating', 'price_asc', 'price_desc']).optional(),
});

const createSchema = z.object({
  title: z.string().min(3).max(220),
  subtitle: z.string().max(300).optional(),
  description: z.string().max(8000).optional(),
  categoryId: z.string().uuid().optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  priceCents: z.number().int().min(0).optional(),
  isPro: z.boolean().optional(),
});

const updateSchema = createSchema.partial().extend({
  requirements: z.array(z.string()).optional(),
  outcomes: z.array(z.string()).optional(),
  thumbnailUrl: z.string().url().optional(),
});

function actor(req: { user?: { id: string; permissions: bigint } }) {
  return { id: req.user!.id, permissions: req.user!.permissions };
}

// --- Public browsing ---
coursesRouter.get(
  '/',
  optionalAuth,
  validate({ query: browseQuery }),
  asyncHandler(async (req, res) => {
    const { page, limit, offset } = resolvePage(req.query as never);
    const q = req.query as z.infer<typeof browseQuery>;
    const { items, total } = await coursesService.browse({
      limit,
      offset,
      search: q.search,
      categorySlug: q.category,
      level: q.level,
      minPrice: q.minPrice,
      maxPrice: q.maxPrice,
      isPro: q.isPro,
      sort: q.sort,
      onlyPublished: true,
    });
    sendOk(res, items, 200, toPageMeta(total, page, limit));
  }),
);

coursesRouter.get(
  '/slug/:slug',
  optionalAuth,
  asyncHandler(async (req, res) => sendOk(res, await coursesService.getBySlug(req.params.slug!))),
);

coursesRouter.get(
  '/id/:id',
  authenticate,
  asyncHandler(async (req, res) => sendOk(res, await coursesService.getById(req.params.id!))),
);

// --- Instructor management ---
coursesRouter.post(
  '/',
  authenticate,
  authorize(Permission.CREATE_COURSE),
  validate({ body: createSchema }),
  asyncHandler(async (req, res) => sendOk(res, await coursesService.create(actor(req), req.body), 201)),
);

coursesRouter.get(
  '/mine',
  authenticate,
  authorize(Permission.VIEW_INSTRUCTOR_PANEL),
  asyncHandler(async (req, res) => {
    const { page, limit, offset } = resolvePage(req.query as never);
    const { items, total } = await coursesService.browse({
      limit,
      offset,
      instructorId: req.user!.id,
      onlyPublished: false,
    });
    sendOk(res, items, 200, toPageMeta(total, page, limit));
  }),
);

coursesRouter.patch(
  '/:id',
  authenticate,
  authorize(Permission.EDIT_COURSE),
  validate({ body: updateSchema }),
  asyncHandler(async (req, res) =>
    sendOk(res, await coursesService.update(actor(req), req.params.id!, req.body)),
  ),
);

coursesRouter.post(
  '/:id/publish',
  authenticate,
  authorize(Permission.PUBLISH_COURSE),
  asyncHandler(async (req, res) =>
    sendOk(res, await coursesService.setStatus(actor(req), req.params.id!, CourseStatus.PUBLISHED)),
  ),
);

coursesRouter.post(
  '/:id/unpublish',
  authenticate,
  authorize(Permission.PUBLISH_COURSE),
  asyncHandler(async (req, res) =>
    sendOk(res, await coursesService.setStatus(actor(req), req.params.id!, CourseStatus.DRAFT)),
  ),
);

coursesRouter.delete(
  '/:id',
  authenticate,
  authorize([Permission.DELETE_COURSE, Permission.MANAGE_ALL_COURSES], 'any'),
  asyncHandler(async (req, res) => {
    await coursesService.remove(actor(req), req.params.id!);
    sendOk(res, { deleted: true });
  }),
);
