import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

/**
 * Loads the root `.env` file once. We walk a couple of levels up so that any
 * workspace package (apps/api, packages/database, ...) resolves the same file.
 */
function bootstrapDotenv(): void {
  const candidates = [
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), '../../.env'),
    resolve(process.cwd(), '../../../.env'),
  ];
  for (const path of candidates) {
    if (existsSync(path)) {
      loadDotenv({ path });
      return;
    }
  }
  // Fall back to process env only (e.g. containerised deployments).
  loadDotenv();
}

bootstrapDotenv();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().default(4000),
  API_URL: z.string().url().default('http://localhost:4000'),
  WEB_URL: z.string().url().default('http://localhost:3000'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be >= 16 chars'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be >= 16 chars'),
  JWT_ACCESS_TTL: z.string().default('7d'),
  JWT_REFRESH_TTL: z.string().default('30d'),

  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),
  GOOGLE_CALLBACK_URL: z
    .string()
    .default('http://localhost:4000/api/v1/auth/oauth/google/callback'),

  GITHUB_CLIENT_ID: z.string().optional().default(''),
  GITHUB_CLIENT_SECRET: z.string().optional().default(''),
  GITHUB_CALLBACK_URL: z
    .string()
    .default('http://localhost:4000/api/v1/auth/oauth/github/callback'),

  RESEND_API_KEY: z.string().optional().default(''),
  EMAIL_FROM: z.string().default('Learnova <onboarding@resend.dev>'),

  STRIPE_SECRET_KEY: z.string().optional().default(''),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(''),
  STRIPE_PRO_PRICE_ID: z.string().optional().default(''),

  IMAGEKIT_PUBLIC_KEY: z.string().optional().default(''),
  IMAGEKIT_PRIVATE_KEY: z.string().optional().default(''),
  IMAGEKIT_URL_ENDPOINT: z.string().optional().default(''),

  MUX_TOKEN_ID: z.string().optional().default(''),
  MUX_TOKEN_SECRET: z.string().optional().default(''),
  MUX_SIGNING_KEY_ID: z.string().optional().default(''),
  MUX_SIGNING_KEY_PRIVATE_KEY: z.string().optional().default(''),

  AI_PROVIDER: z.enum(['openai', 'gemini', 'claude', 'groq', 'mock']).default('mock'),
  OPENAI_API_KEY: z.string().optional().default(''),
  GEMINI_API_KEY: z.string().optional().default(''),
  ANTHROPIC_API_KEY: z.string().optional().default(''),
  GROQ_API_KEY: z.string().optional().default(''),
  GROQ_MODEL: z.string().optional().default('openai/gpt-oss-20b'),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

/**
 * Returns the validated, typed environment. Validation happens lazily on first
 * access so that importing this package never throws at module load time.
 */
export function getEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}

export const isProduction = (): boolean => getEnv().NODE_ENV === 'production';
export const isTest = (): boolean => getEnv().NODE_ENV === 'test';
export const isDevelopment = (): boolean => getEnv().NODE_ENV === 'development';
