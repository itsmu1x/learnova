import { Router } from 'express';
import { z } from 'zod';
import { schema, and, eq, isNull } from '@learnova/database';
import { NotFoundError } from '@learnova/shared';
import { db } from '../../core/database.js';
import { asyncHandler } from '../../core/http/async-handler.js';
import { validate } from '../../core/middleware/validate.js';
import { sendOk } from '../../core/http/responses.js';
import { coursesService } from '../courses/courses.service.js';

export const instructorsRouter: Router = Router();

/**
 * Public instructor profile. Only public fields: never email, roles or account flags.
 * Shown for active instructors, or anyone who has published a course.
 */
instructorsRouter.get(
  '/:id',
  validate({ params: z.object({ id: z.string().uuid() }) }),
  asyncHandler(async (req, res) => {
    const id = req.params.id!;
    const [user] = await db()
      .select({
        id: schema.users.id,
        name: schema.users.name,
        avatarUrl: schema.users.avatarUrl,
        headline: schema.users.headline,
        bio: schema.users.bio,
        joinedAt: schema.users.createdAt,
      })
      .from(schema.users)
      .where(
        and(
          eq(schema.users.id, id),
          isNull(schema.users.deletedAt),
          eq(schema.users.isActive, true),
          eq(schema.users.isBanned, false),
        ),
      )
      .limit(1);
    if (!user) throw new NotFoundError('Instructor not found');

    const { items: courses } = await coursesService.browse({
      instructorId: id,
      onlyPublished: true,
      sort: 'popular',
      limit: 50,
      offset: 0,
    });

    if (courses.length === 0) {
      const [role] = await db()
        .select({ id: schema.roles.id })
        .from(schema.userRoles)
        .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
        .where(and(eq(schema.userRoles.userId, id), eq(schema.roles.slug, 'instructor')))
        .limit(1);
      if (!role) throw new NotFoundError('Instructor not found');
    }

    // Rating weighted by how many reviews each course has.
    const reviews = courses.reduce((n, c) => n + c.ratingCount, 0);
    const rating = reviews ? courses.reduce((n, c) => n + c.averageRating * c.ratingCount, 0) / reviews : 0;

    sendOk(res, {
      ...user,
      stats: {
        courses: courses.length,
        students: courses.reduce((n, c) => n + c.enrollmentCount, 0),
        reviews,
        rating: Math.round(rating * 10) / 10,
      },
      courses,
    });
  }),
);

