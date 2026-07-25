import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { users } from './auth.js';
import {
  courseLevelEnum,
  courseStatusEnum,
  timestamps,
  videoStatusEnum,
} from './_shared.js';

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: varchar('slug', { length: 120 }).notNull(),
    name: varchar('name', { length: 160 }).notNull(),
    description: text('description'),
    icon: varchar('icon', { length: 64 }),
    ...timestamps,
  },
  (t) => ({
    slugUnique: uniqueIndex('categories_slug_unique').on(t.slug),
  }),
);

export const courses = pgTable(
  'courses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: varchar('slug', { length: 220 }).notNull(),
    title: varchar('title', { length: 220 }).notNull(),
    subtitle: varchar('subtitle', { length: 300 }),
    description: text('description'),
    thumbnailUrl: text('thumbnail_url'),
    promoVideoUrl: text('promo_video_url'),
    level: courseLevelEnum('level').default('beginner').notNull(),
    status: courseStatusEnum('status').default('draft').notNull(),
    language: varchar('language', { length: 32 }).default('en').notNull(),
    priceCents: integer('price_cents').default(0).notNull(),
    isPro: boolean('is_pro').default(false).notNull(),
    requirements: jsonb('requirements').$type<string[]>().default([]).notNull(),
    outcomes: jsonb('outcomes').$type<string[]>().default([]).notNull(),
    // Denormalised aggregates kept in sync by the review/enrollment services.
    averageRating: real('average_rating').default(0).notNull(),
    ratingCount: integer('rating_count').default(0).notNull(),
    enrollmentCount: integer('enrollment_count').default(0).notNull(),
    totalDurationSeconds: integer('total_duration_seconds').default(0).notNull(),
    lessonCount: integer('lesson_count').default(0).notNull(),
    instructorId: uuid('instructor_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id').references(() => categories.id, {
      onDelete: 'set null',
    }),
    publishedAt: text('published_at'),
    ...timestamps,
  },
  (t) => ({
    slugUnique: uniqueIndex('courses_slug_unique').on(t.slug),
    instructorIdx: index('courses_instructor_idx').on(t.instructorId),
    categoryIdx: index('courses_category_idx').on(t.categoryId),
    statusIdx: index('courses_status_idx').on(t.status),
  }),
);

export const sections = pgTable(
  'sections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 220 }).notNull(),
    description: text('description'),
    position: integer('position').default(0).notNull(),
    ...timestamps,
  },
  (t) => ({
    courseIdx: index('sections_course_idx').on(t.courseId),
  }),
);

export const lessons = pgTable(
  'lessons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sectionId: uuid('section_id')
      .notNull()
      .references(() => sections.id, { onDelete: 'cascade' }),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 220 }).notNull(),
    description: text('description'),
    position: integer('position').default(0).notNull(),
    durationSeconds: integer('duration_seconds').default(0).notNull(),
    isPreview: boolean('is_preview').default(false).notNull(),
    transcript: text('transcript'),
    aiSummary: text('ai_summary'),
    ...timestamps,
  },
  (t) => ({
    sectionIdx: index('lessons_section_idx').on(t.sectionId),
    courseIdx: index('lessons_course_idx').on(t.courseId),
  }),
);

/**
 * Videos are always hosted by an external provider (Mux). We never store
 * raw files — only provider ids, status, and a derived thumbnail URL.
 */
export const videos = pgTable(
  'videos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    lessonId: uuid('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    provider: varchar('provider', { length: 32 }).default('mux').notNull(),
    providerVideoId: varchar('provider_video_id', { length: 191 }),
    /** Mux playback id once the asset is ready. */
    playbackId: varchar('playback_id', { length: 191 }),
    status: videoStatusEnum('status').default('pending').notNull(),
    durationSeconds: integer('duration_seconds').default(0).notNull(),
    uploadCredentials: jsonb('upload_credentials').$type<Record<string, unknown> | null>(),
    ...timestamps,
  },
  (t) => ({
    lessonUnique: uniqueIndex('videos_lesson_unique').on(t.lessonId),
    providerIdx: index('videos_provider_idx').on(t.provider, t.providerVideoId),
  }),
);

export const lessonResources = pgTable(
  'lesson_resources',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    lessonId: uuid('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 220 }).notNull(),
    url: text('url').notNull(),
    kind: varchar('kind', { length: 32 }).default('link').notNull(),
    ...timestamps,
  },
  (t) => ({
    lessonIdx: index('lesson_resources_lesson_idx').on(t.lessonId),
  }),
);

export const quizzes = pgTable(
  'quizzes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    lessonId: uuid('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 220 }).notNull(),
    // Questions embedded as JSON: [{ q, options[], answerIndex, explanation }]
    questions: jsonb('questions')
      .$type<
        {
          id: string;
          question: string;
          options: string[];
          answerIndex: number;
          explanation?: string;
        }[]
      >()
      .default([])
      .notNull(),
    ...timestamps,
  },
  (t) => ({
    lessonIdx: index('quizzes_lesson_idx').on(t.lessonId),
  }),
);
