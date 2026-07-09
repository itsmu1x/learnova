import { schema, and, eq, isNull, sql, desc } from '@learnova/database';
import { db } from '../../core/database.js';

export interface SearchResultItem {
  type: 'course' | 'lesson' | 'instructor';
  id: string;
  title: string;
  subtitle: string | null;
  slug?: string;
  rank: number;
}

export interface SearchResults {
  query: string;
  courses: SearchResultItem[];
  lessons: SearchResultItem[];
  instructors: SearchResultItem[];
}

/**
 * Search provider abstraction. Today we ship a PostgreSQL full-text provider;
 * a future `SemanticSearchProvider` (pgvector / external embeddings) can be
 * swapped in behind this same interface without touching callers.
 */
export interface SearchProvider {
  readonly kind: string;
  search(query: string, limit: number): Promise<SearchResults>;
}

export class PostgresSearchProvider implements SearchProvider {
  readonly kind = 'postgres-fts';

  async search(query: string, limit: number): Promise<SearchResults> {
    const tsquery = sql`websearch_to_tsquery('english', ${query})`;

    const courses = await db()
      .select({
        id: schema.courses.id,
        title: schema.courses.title,
        subtitle: schema.courses.subtitle,
        slug: schema.courses.slug,
        rank: sql<number>`ts_rank(to_tsvector('english', ${schema.courses.title} || ' ' || coalesce(${schema.courses.subtitle}, '') || ' ' || coalesce(${schema.courses.description}, '')), ${tsquery})`,
      })
      .from(schema.courses)
      .where(
        and(
          eq(schema.courses.status, 'published'),
          isNull(schema.courses.deletedAt),
          sql`to_tsvector('english', ${schema.courses.title} || ' ' || coalesce(${schema.courses.subtitle}, '') || ' ' || coalesce(${schema.courses.description}, '')) @@ ${tsquery}`,
        ),
      )
      .orderBy(desc(sql`rank`))
      .limit(limit);

    const lessons = await db()
      .select({
        id: schema.lessons.id,
        title: schema.lessons.title,
        subtitle: schema.lessons.description,
        courseSlug: schema.courses.slug,
        rank: sql<number>`ts_rank(to_tsvector('english', ${schema.lessons.title} || ' ' || coalesce(${schema.lessons.description}, '')), ${tsquery})`,
      })
      .from(schema.lessons)
      .innerJoin(schema.courses, eq(schema.lessons.courseId, schema.courses.id))
      .where(
        and(
          isNull(schema.lessons.deletedAt),
          eq(schema.courses.status, 'published'),
          sql`to_tsvector('english', ${schema.lessons.title} || ' ' || coalesce(${schema.lessons.description}, '')) @@ ${tsquery}`,
        ),
      )
      .orderBy(desc(sql`rank`))
      .limit(limit);

    const instructors = await db()
      .select({
        id: schema.users.id,
        title: schema.users.name,
        subtitle: schema.users.headline,
        rank: sql<number>`ts_rank(to_tsvector('english', ${schema.users.name} || ' ' || coalesce(${schema.users.headline}, '')), ${tsquery})`,
      })
      .from(schema.users)
      .innerJoin(schema.userRoles, eq(schema.users.id, schema.userRoles.userId))
      .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
      .where(
        and(
          eq(schema.roles.slug, 'instructor'),
          isNull(schema.users.deletedAt),
          sql`to_tsvector('english', ${schema.users.name} || ' ' || coalesce(${schema.users.headline}, '')) @@ ${tsquery}`,
        ),
      )
      .orderBy(desc(sql`rank`))
      .limit(limit);

    return {
      query,
      courses: courses.map((c) => ({ type: 'course', id: c.id, title: c.title, subtitle: c.subtitle, slug: c.slug, rank: c.rank })),
      lessons: lessons.map((l) => ({ type: 'lesson', id: l.id, title: l.title, subtitle: l.subtitle, slug: l.courseSlug, rank: l.rank })),
      instructors: instructors.map((i) => ({ type: 'instructor', id: i.id, title: i.title, subtitle: i.subtitle, rank: i.rank })),
    };
  }
}

let provider: SearchProvider = new PostgresSearchProvider();

export function getSearchProvider(): SearchProvider {
  return provider;
}

export function setSearchProvider(next: SearchProvider): void {
  provider = next;
}
