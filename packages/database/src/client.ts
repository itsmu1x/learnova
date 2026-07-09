import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { getEnv, isProduction } from '@learnova/config';
import * as schema from './schema/index.js';

export type Database = PostgresJsDatabase<typeof schema>;

let client: ReturnType<typeof postgres> | null = null;
let dbInstance: Database | null = null;

/**
 * Lazily instantiate a single pooled connection + Drizzle instance. Reusing a
 * module-level singleton avoids exhausting Postgres connections in serverless
 * and dev-reload environments.
 */
export function getDb(): Database {
  if (dbInstance) return dbInstance;
  const env = getEnv();
  client = postgres(env.DATABASE_URL, {
    max: isProduction() ? 20 : 5,
    idle_timeout: 20,
    prepare: false,
  });
  dbInstance = drizzle(client, { schema, logger: !isProduction() });
  return dbInstance;
}

export async function closeDb(): Promise<void> {
  if (client) {
    await client.end({ timeout: 5 });
    client = null;
    dbInstance = null;
  }
}
