import type { Response } from 'express';
import { ok } from '@learnova/shared';

/** Serialise a value to JSON, converting any bigint into a string. */
function jsonSafe<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_key, value) =>
      typeof value === 'bigint' ? value.toString() : value,
    ),
  );
}

export function sendOk<T>(
  res: Response,
  data: T,
  status = 200,
  meta?: Record<string, unknown>,
): void {
  res.status(status).json(ok(jsonSafe(data), meta ? jsonSafe(meta) : undefined));
}

export function sendCreated<T>(res: Response, data: T): void {
  sendOk(res, data, 201);
}

export function sendNoContent(res: Response): void {
  res.status(204).send();
}
