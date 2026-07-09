import {
  schema,
  and,
  eq,
  isNull,
  desc,
  asc,
  sql,
  ilike,
  or,
  gte,
  lte,
} from '@learnova/database';
import { db } from '../../core/database.js';

export type CourseRow = typeof schema.courses.$inferSelect;

export interface CourseFilters {
  limit: number;
  offset: number;
  search?: string;
  categorySlug?: string;
  level?: string;
  minPrice?: number;
  maxPrice?: number;
  isPro?: boolean;
  sort?: 'newest' | 'popular' | 'rating' | 'price_asc' | 'price_desc';
  instructorId?: string;
  onlyPublished?: boolean;
}

const instructor = {
  id: schema.users.id,
  name: schema.users.name,
  avatarUrl: schema.users.avatarUrl,
};

const category = {
  id: schema.categories.id,
  name: schema.categories.name,
  slug: schema.categories.slug,
};

export const coursesRepository = {
  async list(filters: CourseFilters) {
    const conditions = [isNull(schema.courses.deletedAt)];
    if (filters.onlyPublished !== false) {
      conditions.push(eq(schema.courses.status, 'published'));
    }
    if (filters.instructorId) conditions.push(eq(schema.courses.instructorId, filters.instructorId));
    if (filters.level) conditions.push(eq(schema.courses.level, filters.level as never));
    if (filters.isPro !== undefined) conditions.push(eq(schema.courses.isPro, filters.isPro));
    if (filters.minPrice !== undefined) conditions.push(gte(schema.courses.priceCents, filters.minPrice));
    if (filters.maxPrice !== undefined) conditions.push(lte(schema.courses.priceCents, filters.maxPrice));
    if (filters.categorySlug) conditions.push(eq(schema.categories.slug, filters.categorySlug));
    if (filters.search) {
      const term = `%${filters.search}%`;
      conditions.push(
        or(ilike(schema.courses.title, term), ilike(schema.courses.subtitle, term))!,
      );
    }

    const orderBy = (() => {
      switch (filters.sort) {
        case 'popular':
          return desc(schema.courses.enrollmentCount);
        case 'rating':
          return desc(schema.courses.averageRating);
        case 'price_asc':
          return asc(schema.courses.priceCents);
        case 'price_desc':
          return desc(schema.courses.priceCents);
        default:
          return desc(schema.courses.createdAt);
      }
    })();

    const where = and(...conditions);
    const base = db()
      .select({
        course: schema.courses,
        instructor,
        category,
      })
      .from(schema.courses)
      .innerJoin(schema.users, eq(schema.courses.instructorId, schema.users.id))
      .leftJoin(schema.categories, eq(schema.courses.categoryId, schema.categories.id));

    const [rows, [{ total } = { total: 0 }]] = await Promise.all([
      base.where(where).orderBy(orderBy).limit(filters.limit).offset(filters.offset),
      db()
        .select({ total: sql<number>`count(*)::int` })
        .from(schema.courses)
        .leftJoin(schema.categories, eq(schema.courses.categoryId, schema.categories.id))
        .where(where),
    ]);

    return { items: rows, total };
  },

  async findBySlug(slug: string) {
    const [row] = await db()
      .select({ course: schema.courses, instructor, category })
      .from(schema.courses)
      .innerJoin(schema.users, eq(schema.courses.instructorId, schema.users.id))
      .leftJoin(schema.categories, eq(schema.courses.categoryId, schema.categories.id))
      .where(and(eq(schema.courses.slug, slug), isNull(schema.courses.deletedAt)))
      .limit(1);
    return row;
  },

  async findById(id: string): Promise<CourseRow | undefined> {
    const [row] = await db()
      .select()
      .from(schema.courses)
      .where(and(eq(schema.courses.id, id), isNull(schema.courses.deletedAt)))
      .limit(1);
    return row;
  },

  async findByIdWithRelations(id: string) {
    const [row] = await db()
      .select({ course: schema.courses, instructor, category })
      .from(schema.courses)
      .innerJoin(schema.users, eq(schema.courses.instructorId, schema.users.id))
      .leftJoin(schema.categories, eq(schema.courses.categoryId, schema.categories.id))
      .where(and(eq(schema.courses.id, id), isNull(schema.courses.deletedAt)))
      .limit(1);
    return row;
  },

  async create(values: typeof schema.courses.$inferInsert): Promise<CourseRow> {
    const [row] = await db().insert(schema.courses).values(values).returning();
    return row!;
  },

  async update(id: string, values: Partial<typeof schema.courses.$inferInsert>): Promise<CourseRow> {
    const [row] = await db()
      .update(schema.courses)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(schema.courses.id, id))
      .returning();
    return row!;
  },

  async softDelete(id: string): Promise<void> {
    await db()
      .update(schema.courses)
      .set({ deletedAt: new Date(), status: 'archived' })
      .where(eq(schema.courses.id, id));
  },

  /** Full curriculum tree used by the course detail & learning pages. */
  async getCurriculum(courseId: string) {
    const sections = await db()
      .select()
      .from(schema.sections)
      .where(and(eq(schema.sections.courseId, courseId), isNull(schema.sections.deletedAt)))
      .orderBy(asc(schema.sections.position));

    const lessons = await db()
      .select()
      .from(schema.lessons)
      .where(and(eq(schema.lessons.courseId, courseId), isNull(schema.lessons.deletedAt)))
      .orderBy(asc(schema.lessons.position));

    return sections.map((section) => ({
      ...section,
      lessons: lessons.filter((l) => l.sectionId === section.id),
    }));
  },

  async recomputeCounts(courseId: string): Promise<void> {
    const [{ lessonCount, duration } = { lessonCount: 0, duration: 0 }] = await db()
      .select({
        lessonCount: sql<number>`count(*)::int`,
        duration: sql<number>`coalesce(sum(${schema.lessons.durationSeconds}),0)::int`,
      })
      .from(schema.lessons)
      .where(and(eq(schema.lessons.courseId, courseId), isNull(schema.lessons.deletedAt)));
    await db()
      .update(schema.courses)
      .set({ lessonCount, totalDurationSeconds: duration, updatedAt: new Date() })
      .where(eq(schema.courses.id, courseId));
  },
};
