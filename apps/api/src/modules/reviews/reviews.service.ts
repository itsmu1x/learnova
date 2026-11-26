import { schema, and, eq, desc, sql, isNull } from '@learnova/database';
import { ForbiddenError, NotFoundError } from '@learnova/shared';
import { db } from '../../core/database.js';
import { recordAudit } from '../audit/audit.service.js';

async function recomputeCourseRating(courseId: string): Promise<void> {
  const [{ avg, cnt } = { avg: 0, cnt: 0 }] = await db()
    .select({
      avg: sql<number>`coalesce(avg(${schema.reviews.rating}), 0)::float`,
      cnt: sql<number>`count(*)::int`,
    })
    .from(schema.reviews)
    .where(and(eq(schema.reviews.courseId, courseId), eq(schema.reviews.isHidden, false), isNull(schema.reviews.deletedAt)));
  await db()
    .update(schema.courses)
    .set({ averageRating: Math.round(avg * 10) / 10, ratingCount: cnt, updatedAt: new Date() })
    .where(eq(schema.courses.id, courseId));
}

export const reviewsService = {
  async upsert(
    userId: string,
    courseId: string,
    input: { rating: number; title?: string; body?: string },
  ) {
    // Only enrolled students may review.
    const [enrollment] = await db()
      .select()
      .from(schema.enrollments)
      .where(and(eq(schema.enrollments.userId, userId), eq(schema.enrollments.courseId, courseId)))
      .limit(1);
    if (!enrollment) throw new ForbiddenError('Only enrolled students can review this course');

    const [review] = await db()
      .insert(schema.reviews)
      .values({ userId, courseId, rating: input.rating, title: input.title, body: input.body })
      .onConflictDoUpdate({
        target: [schema.reviews.userId, schema.reviews.courseId],
        // Re-reviewing after a delete brings the review back (deletion is a soft delete on the same row).
        set: { rating: input.rating, title: input.title ?? null, body: input.body ?? null, deletedAt: null, updatedAt: new Date() },
      })
      .returning();
    await recomputeCourseRating(courseId);
    return review;
  },

  async listForCourse(courseId: string, params: { limit: number; offset: number }) {
    const [items, [{ total } = { total: 0 }]] = await Promise.all([
      db()
        .select({
          review: schema.reviews,
          user: { id: schema.users.id, name: schema.users.name, avatarUrl: schema.users.avatarUrl },
        })
        .from(schema.reviews)
        .innerJoin(schema.users, eq(schema.reviews.userId, schema.users.id))
        .where(
          and(eq(schema.reviews.courseId, courseId), eq(schema.reviews.isHidden, false), isNull(schema.reviews.deletedAt)),
        )
        .orderBy(desc(schema.reviews.createdAt))
        .limit(params.limit)
        .offset(params.offset),
      db()
        .select({ total: sql<number>`count(*)::int` })
        .from(schema.reviews)
        .where(
          and(eq(schema.reviews.courseId, courseId), eq(schema.reviews.isHidden, false), isNull(schema.reviews.deletedAt)),
        ),
    ]);
    return { items, total };
  },

  /** Admin moderation queue: every review (hidden ones too), newest first. */
  async listAll(params: { limit: number; offset: number; hidden?: boolean }) {
    const where = and(
      isNull(schema.reviews.deletedAt),
      params.hidden === undefined ? undefined : eq(schema.reviews.isHidden, params.hidden),
    );
    const [items, [{ total } = { total: 0 }]] = await Promise.all([
      db()
        .select({
          review: schema.reviews,
          user: { id: schema.users.id, name: schema.users.name, email: schema.users.email },
          course: { id: schema.courses.id, title: schema.courses.title, slug: schema.courses.slug },
        })
        .from(schema.reviews)
        .innerJoin(schema.users, eq(schema.reviews.userId, schema.users.id))
        .innerJoin(schema.courses, eq(schema.reviews.courseId, schema.courses.id))
        .where(where)
        .orderBy(desc(schema.reviews.createdAt))
        .limit(params.limit)
        .offset(params.offset),
      db().select({ total: sql<number>`count(*)::int` }).from(schema.reviews).where(where),
    ]);
    return { items, total };
  },

  async remove(userId: string, reviewId: string) {
    const [review] = await db().select().from(schema.reviews).where(eq(schema.reviews.id, reviewId)).limit(1);
    if (!review) throw new NotFoundError('Review not found');
    if (review.userId !== userId) throw new ForbiddenError('You can only delete your own review');
    await db().update(schema.reviews).set({ deletedAt: new Date() }).where(eq(schema.reviews.id, reviewId));
    await recomputeCourseRating(review.courseId);
  },

  async moderate(actorId: string, reviewId: string, isHidden: boolean) {
    const [review] = await db().select().from(schema.reviews).where(eq(schema.reviews.id, reviewId)).limit(1);
    if (!review) throw new NotFoundError('Review not found');
    await db().update(schema.reviews).set({ isHidden, updatedAt: new Date() }).where(eq(schema.reviews.id, reviewId));
    await recomputeCourseRating(review.courseId);
    await recordAudit({
      actorId,
      action: 'review.moderate',
      entityType: 'review',
      entityId: reviewId,
      newData: { isHidden },
    });
  },
};
