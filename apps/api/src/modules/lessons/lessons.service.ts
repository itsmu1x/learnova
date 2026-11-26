import { schema, and, eq, isNull, sql } from '@learnova/database';
import { NotFoundError } from '@learnova/shared';
import { db } from '../../core/database.js';
import { coursesService } from '../courses/courses.service.js';
import { coursesRepository } from '../courses/courses.repository.js';
import { summarizeLesson, generateQuiz } from '../../services/ai/index.js';

interface Actor {
  id: string;
  permissions: bigint;
}

export const lessonsService = {
  async getFull(lessonId: string) {
    const [lesson] = await db()
      .select()
      .from(schema.lessons)
      .where(and(eq(schema.lessons.id, lessonId), isNull(schema.lessons.deletedAt)))
      .limit(1);
    if (!lesson) throw new NotFoundError('Lesson not found');

    const [video] = await db()
      .select()
      .from(schema.videos)
      .where(eq(schema.videos.lessonId, lessonId))
      .limit(1);
    const resources = await db()
      .select()
      .from(schema.lessonResources)
      .where(eq(schema.lessonResources.lessonId, lessonId));
    const [quiz] = await db()
      .select()
      .from(schema.quizzes)
      .where(eq(schema.quizzes.lessonId, lessonId))
      .limit(1);

    return { ...lesson, video: video ?? null, resources, quiz: quiz ?? null };
  },

  async create(
    actor: Actor,
    input: { sectionId: string; courseId: string; title: string; isPreview?: boolean },
  ) {
    await coursesService.assertOwnership(actor, input.courseId);
    const [{ maxPos } = { maxPos: -1 }] = await db()
      .select({ maxPos: sql<number>`coalesce(max(${schema.lessons.position}), -1)::int` })
      .from(schema.lessons)
      .where(eq(schema.lessons.sectionId, input.sectionId));

    const [lesson] = await db()
      .insert(schema.lessons)
      .values({
        sectionId: input.sectionId,
        courseId: input.courseId,
        title: input.title,
        isPreview: input.isPreview ?? false,
        position: maxPos + 1,
      })
      .returning();

    // A lesson always has an associated (pending) video record.
    await db().insert(schema.videos).values({ lessonId: lesson!.id, status: 'pending' });
    await coursesRepository.recomputeCounts(input.courseId);
    return this.getFull(lesson!.id);
  },

  async update(
    actor: Actor,
    lessonId: string,
    input: Partial<{
      title: string;
      description: string;
      transcript: string;
      isPreview: boolean;
      durationSeconds: number;
    }>,
  ) {
    const [lesson] = await db()
      .select()
      .from(schema.lessons)
      .where(eq(schema.lessons.id, lessonId))
      .limit(1);
    if (!lesson) throw new NotFoundError('Lesson not found');
    await coursesService.assertOwnership(actor, lesson.courseId);
    await db()
      .update(schema.lessons)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(schema.lessons.id, lessonId));
    if (input.durationSeconds !== undefined) {
      await coursesRepository.recomputeCounts(lesson.courseId);
    }
    return this.getFull(lessonId);
  },

  async remove(actor: Actor, lessonId: string) {
    const [lesson] = await db()
      .select()
      .from(schema.lessons)
      .where(eq(schema.lessons.id, lessonId))
      .limit(1);
    if (!lesson) throw new NotFoundError('Lesson not found');
    await coursesService.assertOwnership(actor, lesson.courseId);
    await db()
      .update(schema.lessons)
      .set({ deletedAt: new Date() })
      .where(eq(schema.lessons.id, lessonId));
    await coursesRepository.recomputeCounts(lesson.courseId);
  },

  async addResource(actor: Actor, lessonId: string, input: { title: string; url: string; kind?: string }) {
    const [lesson] = await db()
      .select()
      .from(schema.lessons)
      .where(eq(schema.lessons.id, lessonId))
      .limit(1);
    if (!lesson) throw new NotFoundError('Lesson not found');
    await coursesService.assertOwnership(actor, lesson.courseId);
    const [row] = await db()
      .insert(schema.lessonResources)
      .values({ lessonId, title: input.title, url: input.url, kind: input.kind ?? 'link' })
      .returning();
    return row;
  },

  async generateSummary(actor: Actor, lessonId: string) {
    const [lesson] = await db()
      .select()
      .from(schema.lessons)
      .where(eq(schema.lessons.id, lessonId))
      .limit(1);
    if (!lesson) throw new NotFoundError('Lesson not found');
    await coursesService.assertOwnership(actor, lesson.courseId);
    const summary = await summarizeLesson(lesson.title, lesson.transcript ?? lesson.title);
    await db()
      .update(schema.lessons)
      .set({ aiSummary: summary, updatedAt: new Date() })
      .where(eq(schema.lessons.id, lessonId));
    return { aiSummary: summary };
  },

  async generateQuizForLesson(actor: Actor, lessonId: string, count = 5) {
    const [lesson] = await db()
      .select()
      .from(schema.lessons)
      .where(eq(schema.lessons.id, lessonId))
      .limit(1);
    if (!lesson) throw new NotFoundError('Lesson not found');
    await coursesService.assertOwnership(actor, lesson.courseId);
    const questions = await generateQuiz(lesson.title, lesson.transcript ?? lesson.title, count);
    const withIds = questions.map((q, i) => ({ id: `q${i + 1}`, ...q }));
    const [existing] = await db()
      .select()
      .from(schema.quizzes)
      .where(eq(schema.quizzes.lessonId, lessonId))
      .limit(1);
    if (existing) {
      await db()
        .update(schema.quizzes)
        .set({ questions: withIds, updatedAt: new Date() })
        .where(eq(schema.quizzes.id, existing.id));
    } else {
      await db()
        .insert(schema.quizzes)
        .values({ lessonId, title: `${lesson.title} quiz`, questions: withIds });
    }
    return { questions: withIds };
  },

  async reorder(actor: Actor, courseId: string, orderedIds: string[]) {
    await coursesService.assertOwnership(actor, courseId);
    for (let i = 0; i < orderedIds.length; i++) {
      // Scoped to the owned course so ids from someone else's course are ignored.
      await db()
        .update(schema.lessons)
        .set({ position: i, updatedAt: new Date() })
        .where(and(eq(schema.lessons.id, orderedIds[i]!), eq(schema.lessons.courseId, courseId)));
    }
  },
};
