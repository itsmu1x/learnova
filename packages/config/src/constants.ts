/**
 * Application-wide constants shared across services.
 */
export const APP = {
  NAME: 'Learnova',
  API_PREFIX: '/api/v1',
  SUPPORT_EMAIL: 'support@learnova.dev',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  MAX_LIMIT: 100,
} as const;

export const TOKENS = {
  ACCESS_COOKIE: 'learnova_access',
  REFRESH_COOKIE: 'learnova_refresh',
  EMAIL_VERIFY_TTL_HOURS: 24,
  PASSWORD_RESET_TTL_HOURS: 1,
} as const;

export const PRICING = {
  CURRENCY: 'usd',
  PRO_MONTHLY_CENTS: 1900,
} as const;

export const VIDEO = {
  PROVIDER: 'mux',
} as const;

export const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000,
  MAX_REQUESTS: 300,
  AUTH_MAX_REQUESTS: 20,
} as const;
