import rateLimit from 'express-rate-limit';
import { fail } from '@learnova/shared';
import { RATE_LIMIT } from '@learnova/config';

export const globalRateLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max: RATE_LIMIT.MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) =>
    res.status(429).json(fail('RATE_LIMITED', 'Too many requests, please slow down')),
});

export const authRateLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max: RATE_LIMIT.AUTH_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) =>
    res.status(429).json(fail('RATE_LIMITED', 'Too many authentication attempts')),
});
