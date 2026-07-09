import type { Request } from 'express';

/** The authenticated principal attached to a request by the auth middleware. */
export interface RequestUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
  /** Effective permission bitmask. */
  permissions: bigint;
}

export interface AuthedRequest extends Request {
  user?: RequestUser;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: RequestUser;
      requestId?: string;
    }
  }
}
