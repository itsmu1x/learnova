import { defineConfig } from 'drizzle-kit';
import { getEnv } from '@learnova/config';

export default defineConfig({
  // Points at the compiled schema so drizzle-kit's bundler resolves the
  // NodeNext `.js` import specifiers. Run `tsc` (build) before generating.
  schema: './dist/schema/index.js',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: getEnv().DATABASE_URL,
  },
  verbose: true,
  strict: true,
});
