import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError, fail, isAppError } from '@learnova/shared';
import { isProduction } from '@learnova/config';
import { logger } from '../logger.js';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json(fail('NOT_FOUND', `Route ${req.method} ${req.path} not found`));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res
      .status(422)
      .json(fail('VALIDATION_ERROR', 'Validation failed', err.flatten().fieldErrors));
    return;
  }

  if (isAppError(err)) {
    if (!err.isOperational) logger.error(err.message, err.details);
    res.status(err.statusCode).json(fail(err.code, err.message, err.details));
    return;
  }

  const error = err as Error;
  logger.error('Unhandled error', { message: error?.message, stack: error?.stack });
  const internal = new AppError('Internal server error', 500, 'INTERNAL_ERROR', undefined, false);
  res
    .status(internal.statusCode)
    .json(
      fail(
        internal.code,
        internal.message,
        isProduction() ? undefined : error?.message,
      ),
    );
}
