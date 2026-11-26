import { Router } from 'express';
import { authRouter } from './modules/auth/auth.routes.js';
import { usersRouter } from './modules/users/users.routes.js';
import { rolesRouter } from './modules/roles/roles.routes.js';
import { permissionsRouter } from './modules/permissions/permissions.routes.js';
import { categoriesRouter } from './modules/categories/categories.routes.js';
import { coursesRouter } from './modules/courses/courses.routes.js';
import { sectionsRouter } from './modules/sections/sections.routes.js';
import { lessonsRouter } from './modules/lessons/lessons.routes.js';
import { videosRouter } from './modules/videos/videos.routes.js';
import { enrollmentsRouter } from './modules/enrollments/enrollments.routes.js';
import { reviewsRouter } from './modules/reviews/reviews.routes.js';
import { certificatesRouter } from './modules/certificates/certificates.routes.js';
import { paymentsRouter } from './modules/payments/payments.routes.js';
import { searchRouter } from './modules/search/search.routes.js';
import { instructorsRouter } from './modules/instructors/instructors.routes.js';
import { aiRouter } from './modules/ai/ai.routes.js';
import { uploadsRouter } from './modules/uploads/uploads.routes.js';
import { auditRouter } from './modules/audit/audit.routes.js';
import { analyticsRouter } from './modules/analytics/analytics.routes.js';
import { instructorApplicationsRouter } from './modules/instructor-applications/instructor-applications.routes.js';

/** Builds the versioned API router mounted at /api/v1. */
export function buildApiRouter(): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    res.json({
      success: true,
      data: { name: 'Learnova API', version: 'v1', status: 'ok' },
    });
  });

  router.use('/auth', authRouter);
  router.use('/users', usersRouter);
  router.use('/roles', rolesRouter);
  router.use('/permissions', permissionsRouter);
  router.use('/categories', categoriesRouter);
  router.use('/courses', coursesRouter);
  router.use('/sections', sectionsRouter);
  router.use('/lessons', lessonsRouter);
  router.use('/videos', videosRouter);
  router.use('/enrollments', enrollmentsRouter);
  router.use('/reviews', reviewsRouter);
  router.use('/certificates', certificatesRouter);
  router.use('/payments', paymentsRouter);
  router.use('/search', searchRouter);
  router.use('/ai', aiRouter);
  router.use('/uploads', uploadsRouter);
  router.use('/audit', auditRouter);
  router.use('/analytics', analyticsRouter);
  router.use('/instructor-applications', instructorApplicationsRouter);
  router.use('/instructors', instructorsRouter);

  return router;
}
