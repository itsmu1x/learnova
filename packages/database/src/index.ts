export { getDb, closeDb, type Database } from './client.js';
export * as schema from './schema/index.js';

// Re-export drizzle-orm operators so consumers don't need a direct dependency.
export {
  and,
  or,
  eq,
  ne,
  gt,
  gte,
  lt,
  lte,
  isNull,
  isNotNull,
  inArray,
  notInArray,
  like,
  ilike,
  sql,
  asc,
  desc,
  count,
  sum,
  avg,
  countDistinct,
} from 'drizzle-orm';
