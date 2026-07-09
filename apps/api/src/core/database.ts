import { getDb, type Database } from '@learnova/database';

/** Central accessor so modules depend on the app core, not the package directly. */
export function db(): Database {
  return getDb();
}

export type { Database };
