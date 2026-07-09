import { schema, and, eq, isNull, sql, desc, inArray } from '@learnova/database';
import { db } from '../../core/database.js';

export const analyticsService = {
  /** Aggregated metrics for an instructor's own courses. */
  async instructorOverview(instructorId: string) {
    const courses = await db()
      .select({ id: schema.courses.id, title: schema.courses.title })
      .from(schema.courses)
      .where(and(eq(schema.courses.instructorId, instructorId), isNull(schema.courses.deletedAt)));
    const courseIds = courses.map((c) => c.id);

    if (courseIds.length === 0) {
      return { totalCourses: 0, totalStudents: 0, revenueCents: 0, averageRating: 0, completionRate: 0, watchTimeHours: 0, topCourses: [] };
    }

    const [{ students } = { students: 0 }] = await db()
      .select({ students: sql<number>`count(distinct ${schema.enrollments.userId})::int` })
      .from(schema.enrollments)
      .where(inArray(schema.enrollments.courseId, courseIds));

    const [{ revenue } = { revenue: 0 }] = await db()
      .select({ revenue: sql<number>`coalesce(sum(${schema.purchases.amountCents}),0)::int` })
      .from(schema.purchases)
      .where(and(inArray(schema.purchases.courseId, courseIds), eq(schema.purchases.status, 'succeeded')));

    const [{ rating } = { rating: 0 }] = await db()
      .select({ rating: sql<number>`coalesce(avg(${schema.courses.averageRating}),0)::float` })
      .from(schema.courses)
      .where(inArray(schema.courses.id, courseIds));

    const [{ completed, totalEnroll } = { completed: 0, totalEnroll: 0 }] = await db()
      .select({
        completed: sql<number>`count(*) filter (where ${schema.enrollments.completedAt} is not null)::int`,
        totalEnroll: sql<number>`count(*)::int`,
      })
      .from(schema.enrollments)
      .where(inArray(schema.enrollments.courseId, courseIds));

    const [{ watchSeconds } = { watchSeconds: 0 }] = await db()
      .select({ watchSeconds: sql<number>`coalesce(sum(${schema.lessonProgress.watchedSeconds}),0)::int` })
      .from(schema.lessonProgress)
      .where(inArray(schema.lessonProgress.courseId, courseIds));

    const topCourses = await db()
      .select({
        id: schema.courses.id,
        title: schema.courses.title,
        enrollmentCount: schema.courses.enrollmentCount,
        averageRating: schema.courses.averageRating,
      })
      .from(schema.courses)
      .where(inArray(schema.courses.id, courseIds))
      .orderBy(desc(schema.courses.enrollmentCount))
      .limit(5);

    return {
      totalCourses: courses.length,
      totalStudents: students,
      revenueCents: revenue,
      averageRating: Math.round(rating * 10) / 10,
      completionRate: totalEnroll === 0 ? 0 : Math.round((completed / totalEnroll) * 100),
      watchTimeHours: Math.round(watchSeconds / 3600),
      topCourses,
    };
  },

  /** Platform-wide metrics for the admin dashboard. */
  async adminOverview() {
    const [{ users } = { users: 0 }] = await db()
      .select({ users: sql<number>`count(*)::int` })
      .from(schema.users)
      .where(isNull(schema.users.deletedAt));
    const [{ courses } = { courses: 0 }] = await db()
      .select({ courses: sql<number>`count(*)::int` })
      .from(schema.courses)
      .where(isNull(schema.courses.deletedAt));
    const [{ revenue } = { revenue: 0 }] = await db()
      .select({ revenue: sql<number>`coalesce(sum(${schema.payments.amountCents}),0)::int` })
      .from(schema.payments)
      .where(eq(schema.payments.status, 'succeeded'));
    const [{ subs } = { subs: 0 }] = await db()
      .select({ subs: sql<number>`count(*)::int` })
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.status, 'active'));
    const [{ enrollments } = { enrollments: 0 }] = await db()
      .select({ enrollments: sql<number>`count(*)::int` })
      .from(schema.enrollments);

    return {
      totalUsers: users,
      totalCourses: courses,
      revenueCents: revenue,
      activeSubscriptions: subs,
      totalEnrollments: enrollments,
    };
  },
};
