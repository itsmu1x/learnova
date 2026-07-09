import type { NextFunction, Request, Response } from 'express';
import {
  ForbiddenError,
  UnauthorizedError,
  combine,
  hasAllPermissions,
  hasAnyPermission,
} from '@learnova/shared';

type Mode = 'all' | 'any';

/**
 * Permission middleware. Accepts one or more permission bits and asserts the
 * authenticated user's effective bitmask satisfies them.
 *
 *   authorize(Permission.VIEW_ADMIN_PANEL)                 // single page permission
 *   authorize([Permission.CREATE_COURSE], 'all')          // action permission
 *   authorize([Permission.EDIT_COURSE, Permission.MANAGE_ALL_COURSES], 'any')
 */
export function authorize(required: bigint | bigint[], mode: Mode = 'all') {
  const bits = Array.isArray(required) ? required : [required];
  const mask = combine(...bits);
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new UnauthorizedError());
    const userMask = req.user.permissions;
    const allowed =
      mode === 'all' ? hasAllPermissions(userMask, mask) : hasAnyPermission(userMask, mask);
    if (!allowed) return next(new ForbiddenError());
    next();
  };
}
