import { Router } from 'express';
import { z } from 'zod';
import { schema, eq } from '@learnova/database';
import { Permission } from '@learnova/shared';
import { db } from '../../core/database.js';
import { asyncHandler } from '../../core/http/async-handler.js';
import { authenticate } from '../../core/middleware/authenticate.js';
import { authorize } from '../../core/middleware/authorize.js';
import { validate } from '../../core/middleware/validate.js';
import { sendOk } from '../../core/http/responses.js';
import { askTutor, generateCourseDescription, getAIService } from '../../services/ai/index.js';

export const aiRouter: Router = Router();

aiRouter.use(authenticate);

const tutorSchema = z.object({
  question: z.string().min(1).max(2000),
  lessonId: z.string().uuid().optional(),
  history: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() }))
    .max(10)
    .optional(),
});

aiRouter.post(
  '/tutor',
  authorize(Permission.USE_AI_TUTOR),
  validate({ body: tutorSchema }),
  asyncHandler(async (req, res) => {
    const { question, lessonId, history } = req.body as z.infer<typeof tutorSchema>;
    let lessonTitle: string | undefined;
    let courseTitle: string | undefined;
    let transcript: string | undefined;

    if (lessonId) {
      const [lesson] = await db().select().from(schema.lessons).where(eq(schema.lessons.id, lessonId)).limit(1);
      if (lesson) {
        lessonTitle = lesson.title;
        transcript = lesson.transcript ?? undefined;
        const [course] = await db().select().from(schema.courses).where(eq(schema.courses.id, lesson.courseId)).limit(1);
        courseTitle = course?.title;
      }
    }

    const answer = await askTutor({ question, lessonTitle, courseTitle, transcript, history });
    sendOk(res, { answer, provider: getAIService().name });
  }),
);

aiRouter.post(
  '/course-description',
  authorize(Permission.CREATE_COURSE),
  validate({ body: z.object({ title: z.string().min(3), topics: z.array(z.string()).default([]) }) }),
  asyncHandler(async (req, res) => {
    const { title, topics } = req.body as { title: string; topics: string[] };
    const description = await generateCourseDescription(title, topics);
    sendOk(res, { description, provider: getAIService().name });
  }),
);
