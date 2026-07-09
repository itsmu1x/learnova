export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Disable Next.js caching for dynamic data (default true). */
  noStore?: boolean;
}

/**
 * Thin, typed fetch wrapper around the Learnova API. Credentials are always
 * included so the httpOnly auth cookies flow with every request.
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, noStore = true, headers, ...rest } = options;
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...(noStore ? { cache: 'no-store' } : {}),
  });

  const json = (await res.json().catch(() => null)) as
    | { success: true; data: T; meta?: Record<string, unknown> }
    | { success: false; error: ApiError }
    | null;

  if (!res.ok || !json || json.success === false) {
    const error = json && 'error' in json ? json.error : { code: 'UNKNOWN', message: res.statusText };
    throw new ApiRequestError(error.message, res.status, error.code, error.details);
  }
  return json.data;
}

/** Variant that returns both data and pagination meta. */
export async function apiFetchWithMeta<T>(
  path: string,
  options: RequestOptions = {},
): Promise<{ data: T; meta?: Record<string, unknown> }> {
  const { body, noStore = true, headers, ...rest } = options;
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...(noStore ? { cache: 'no-store' } : {}),
  });
  const json = (await res.json().catch(() => null)) as
    | { success: true; data: T; meta?: Record<string, unknown> }
    | { success: false; error: ApiError }
    | null;
  if (!res.ok || !json || json.success === false) {
    const error = json && 'error' in json ? json.error : { code: 'UNKNOWN', message: res.statusText };
    throw new ApiRequestError(error.message, res.status, error.code, error.details);
  }
  return { data: json.data, meta: json.meta };
}

/** Safe server-side fetch that never throws — returns a fallback on error. */
export async function safeFetch<T>(path: string, fallback: T): Promise<T> {
  try {
    return await apiFetch<T>(path);
  } catch {
    return fallback;
  }
}
