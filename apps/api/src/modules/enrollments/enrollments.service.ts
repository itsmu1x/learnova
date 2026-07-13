import { schema, and, eq, desc, sql, isNull, gt } from '@learnova/database';
import { ConflictError, ForbiddenError, NotFoundError } from '@learnova/shared';
import { db } from '../../core/database.js';
import { coursesRepository } from '../courses/courses.repository.js';
import { certificatesService } from '../certificates/certificates.service.js';
import { recordAudit } from '../audit/audit.service.js';

async function hasActivePro(userId: string): Promise<boolean> {
  const [sub] = await db()
    .select()
    .from(schema.subscriptions)
    .where(and(eq(schema.subscriptions.userId, userId), eq(schema.subscriptions.status, 'active')))
    .limit(1);
  return Boolean(sub);
}

async function hasPurchased(userId: string, courseId: string): Promise<boolean> {
  const [purchase] = await db()
    .select()
    .from(schema.purchases)
    .where(
      and(
        eq(schema.purchases.userId, userId),
        eq(schema.purchases.courseId, courseId),
        eq(schema.purchases.status, 'succeeded'),
      ),
    )
    .limit(1);
  return Boolean(purchase);
}

export const enrollmentsService = {
  /** Grants access when the course is free, purchased, or covered by Pro. */
  async enroll(userId: string, courseId: string) {
    const course = await coursesRepository.findById(courseId);
    if (!course) throw new NotFoundError('Course not found');

    const [existing] = await db()
      .select()
      .from(schema.enrollments)
      .where(and(eq(schema.enrollments.userId, userId), eq(schema.enrollments.courseId, courseId)))
      .limit(1);
    if (existing) throw new ConflictError('Already enrolled');

    const isFree = course.priceCents === 0 && !course.isPro;
    const allowed =
      isFree || (course.isPro ? await hasActivePro(userId) : await hasPurchased(userId, courseId));
    if (!allowed) {
      throw new ForbiddenError('Purchase this course (or Learnova Pro) to enroll');
    }

    const [enrollment] = await db()
      .insert(schema.enrollments)
      .values({ userId, courseId })
      .returning();
    await db()
      .update(schema.courses)
      .set({ enrollmentCount: sql`${schema.courses.enrollmentCount} + 1` })
      .where(eq(schema.courses.id, courseId));
    await recordAudit({
      actorId: userId,
      action: 'course.enroll',
      entityType: 'course',
      entityId: courseId,
    });
    return enrollment;
  },

  async myEnrollments(userId: string) {
    return db()
      .select({
        enrollment: schema.enrollments,
        course: schema.courses,
      })
      .from(schema.enrollments)
      .innerJoin(schema.courses, eq(schema.enrollments.courseId, schema.courses.id))
      .where(eq(schema.enrollments.userId, userId))
      .orderBy(desc(schema.enrollments.updatedAt));
  },

  /** In-progress courses ordered by most recent activity. */
  async continueLearning(userId: string) {
    return db()
      .select({ enrollment: schema.enrollments, course: schema.courses })
      .from(schema.enrollments)
      .innerJoin(schema.courses, eq(schema.enrollments.courseId, schema.courses.id))
      .where(
        and(
          eq(schema.enrollments.userId, userId),
          isNull(schema.enrollments.completedAt),
          gt(schema.enrollments.progressPercent, 0),
        ),
      )
      .orderBy(desc(schema.enrollments.updatedAt))
      .limit(6);
  },

  async requireEnrollment(userId: string, courseId: string) {
    const [enrollment] = await db()
      .select()
      .from(schema.enrollments)
      .where(and(eq(schema.enrollments.userId, userId), eq(schema.enrollments.courseId, courseId)))
      .limit(1);
    if (!enrollment) throw new ForbiddenError('You are not enrolled in this course');
    return enrollment;
  },

  /** Lightweight ownership check for course-detail CTAs. */
  async getStatus(userId: string, courseId: string) {
    const [enrollment] = await db()
      .select({
        id: schema.enrollments.id,
        progressPercent: schema.enrollments.progressPercent,
        completedAt: schema.enrollments.completedAt,
      })
      .from(schema.enrollments)
      .where(and(eq(schema.enrollments.userId, userId), eq(schema.enrollments.courseId, courseId)))
      .limit(1);

    if (!enrollment) {
      return { enrolled: false as const, progressPercent: 0, completed: false };
    }

    return {
      enrolled: true as const,
      progressPercent: enrollment.progressPercent,
      completed: Boolean(enrollment.completedAt),
    };
  },

  async updateLessonProgress(
    userId: string,
    lessonId: string,
    input: { watchedSeconds?: number; lastPositionSeconds?: number; completed?: boolean },
  ) {
    const [lesson] = await db()
      .select()
      .from(schema.lessons)
      .where(eq(schema.lessons.id, lessonId))
      .limit(1);
    if (!lesson) throw new NotFoundError('Lesson not found');
    await this.requireEnrollment(userId, lesson.courseId);

    const now = new Date();
    await db()
      .insert(schema.lessonProgress)
      .values({
        userId,
        lessonId,
        courseId: lesson.courseId,
        watchedSeconds: input.watchedSeconds ?? 0,
        lastPositionSeconds: input.lastPositionSeconds ?? 0,
        isCompleted: input.completed ?? false,
        completedAt: input.completed ? now : null,
      })
      .onConflictDoUpdate({
        target: [schema.lessonProgress.userId, schema.lessonProgress.lessonId],
        set: {
          watchedSeconds: input.watchedSeconds ?? sql`${schema.lessonProgress.watchedSeconds}`,
          lastPositionSeconds:
            input.lastPositionSeconds ?? sql`${schema.lessonProgress.lastPositionSeconds}`,
          isCompleted: input.completed ?? sql`${schema.lessonProgress.isCompleted}`,
          completedAt: input.completed ? now : sql`${schema.lessonProgress.completedAt}`,
          updatedAt: now,
        },
      });

    return this.recomputeProgress(userId, lesson.courseId, lessonId);
  },

  /** Recomputes enrollment progress and issues a certificate at 100%. */
  async recomputeProgress(userId: string, courseId: string, lastLessonId?: string) {
    const [{ total } = { total: 0 }] = await db()
      .select({ total: sql<number>`count(*)::int` })
      .from(schema.lessons)
      .where(and(eq(schema.lessons.courseId, courseId), isNull(schema.lessons.deletedAt)));

    const [{ completed } = { completed: 0 }] = await db()
      .select({ completed: sql<number>`count(*)::int` })
      .from(schema.lessonProgress)
      .where(
        and(
          eq(schema.lessonProgress.userId, userId),
          eq(schema.lessonProgress.courseId, courseId),
          eq(schema.lessonProgress.isCompleted, true),
        ),
      );

    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    const isComplete = total > 0 && completed >= total;

    const [enrollment] = await db()
      .update(schema.enrollments)
      .set({
        progressPercent: percent,
        completedLessonCount: completed,
        lastLessonId: lastLessonId ?? null,
        completedAt: isComplete ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(and(eq(schema.enrollments.userId, userId), eq(schema.enrollments.courseId, courseId)))
      .returning();

    let certificate = null;
    if (isComplete) {
      certificate = await certificatesService.issue(userId, courseId);
    }

    return { enrollment, certificate };
  },

  async getCourseProgress(userId: string, courseId: string) {
    await this.requireEnrollment(userId, courseId);
    const rows = await db()
      .select()
      .from(schema.lessonProgress)
      .where(
        and(eq(schema.lessonProgress.userId, userId), eq(schema.lessonProgress.courseId, courseId)),
      );
    return rows;
  },
};
