import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { getEnv } from '@learnova/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main(): Promise<void> {
  const env = getEnv();
  const client = postgres(env.DATABASE_URL, { max: 1 });
  const db = drizzle(client);
  const migrationsFolder = resolve(__dirname, '../drizzle');

  console.log('Running migrations from', migrationsFolder);
  await migrate(db, { migrationsFolder });
  console.log('Migrations applied successfully.');
  await client.end();
}

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
