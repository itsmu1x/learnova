import {
  boolean,
  index,
  integer,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { users } from './auth.js';
import { courses, lessons } from './catalog.js';
import { timestamps } from './_shared.js';

export const enrollments = pgTable(
  'enrollments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    progressPercent: integer('progress_percent').default(0).notNull(),
    completedLessonCount: integer('completed_lesson_count').default(0).notNull(),
    lastLessonId: uuid('last_lesson_id').references(() => lessons.id, {
      onDelete: 'set null',
    }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => ({
    unique: uniqueIndex('enrollments_user_course_unique').on(t.userId, t.courseId),
    userIdx: index('enrollments_user_idx').on(t.userId),
    courseIdx: index('enrollments_course_idx').on(t.courseId),
  }),
);

export const lessonProgress = pgTable(
  'lesson_progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    lessonId: uuid('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    isCompleted: boolean('is_completed').default(false).notNull(),
    watchedSeconds: integer('watched_seconds').default(0).notNull(),
    lastPositionSeconds: integer('last_position_seconds').default(0).notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => ({
    unique: uniqueIndex('lesson_progress_user_lesson_unique').on(t.userId, t.lessonId),
    userCourseIdx: index('lesson_progress_user_course_idx').on(t.userId, t.courseId),
  }),
);

export const notes = pgTable(
  'notes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    lessonId: uuid('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    timestampSeconds: integer('timestamp_seconds').default(0).notNull(),
    ...timestamps,
  },
  (t) => ({
    userLessonIdx: index('notes_user_lesson_idx').on(t.userId, t.lessonId),
  }),
);

export const reviews = pgTable(
  'reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    rating: smallint('rating').notNull(),
    title: varchar('title', { length: 220 }),
    body: text('body'),
    isHidden: boolean('is_hidden').default(false).notNull(),
    ...timestamps,
  },
  (t) => ({
    unique: uniqueIndex('reviews_user_course_unique').on(t.userId, t.courseId),
    courseIdx: index('reviews_course_idx').on(t.courseId),
  }),
);

export const certificates = pgTable(
  'certificates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: varchar('code', { length: 32 }).notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    recipientName: varchar('recipient_name', { length: 200 }).notNull(),
    courseTitle: varchar('course_title', { length: 220 }).notNull(),
    instructorName: varchar('instructor_name', { length: 200 }).notNull(),
    issuedAt: timestamp('issued_at', { withTimezone: true }).defaultNow().notNull(),
    ...timestamps,
  },
  (t) => ({
    codeUnique: uniqueIndex('certificates_code_unique').on(t.code),
    userCourseIdx: index('certificates_user_course_idx').on(t.userId, t.courseId),
  }),
);
