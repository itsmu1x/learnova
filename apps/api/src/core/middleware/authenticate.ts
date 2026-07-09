import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '@learnova/auth';
import { UnauthorizedError } from '@learnova/shared';
import { TOKENS } from '@learnova/config';

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  const cookie = (req.cookies as Record<string, string> | undefined)?.[TOKENS.ACCESS_COOKIE];
  return cookie ?? null;
}

/** Requires a valid access token; attaches `req.user`. */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) return next(new UnauthorizedError('Authentication required'));
  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      name: '',
      roles: payload.roles,
      permissions: BigInt(payload.perms),
    };
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
}

/** Attaches `req.user` when a token is present, but never rejects the request. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      name: '',
      roles: payload.roles,
      permissions: BigInt(payload.perms),
    };
  } catch {
    // ignore invalid tokens on optional routes
  }
  next();
}
