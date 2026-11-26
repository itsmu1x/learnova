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
  /** Skip 401 → refresh retry (used by the refresh call itself). */
  skipAuthRefresh?: boolean;
}

type ApiJson<T> =
  | { success: true; data: T; meta?: Record<string, unknown> }
  | { success: false; error: ApiError };

/** Single-flight refresh so concurrent 401s don't rotate the refresh token twice. */
let refreshInFlight: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: '{}',
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

function throwIfFailed<T>(res: Response, json: ApiJson<T> | null): asserts json is { success: true; data: T; meta?: Record<string, unknown> } {
  if (!res.ok || !json || json.success === false) {
    const error = json && 'error' in json ? json.error : { code: 'UNKNOWN', message: res.statusText };
    throw new ApiRequestError(error.message, res.status, error.code, error.details);
  }
}

async function rawFetch(path: string, options: RequestOptions = {}): Promise<Response> {
  const { body, noStore = true, headers, skipAuthRefresh: _skip, ...rest } = options;
  try {
    return await fetch(`${API_URL}${path}`, {
      ...rest,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...(noStore ? { cache: 'no-store' } : {}),
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    // Browsers report network/CORS failures as a bare "Failed to fetch".
    throw new ApiRequestError("Can't reach Learnova right now. Check your connection and try again.", 0, 'NETWORK');
  }
}

/**
 * Thin, typed fetch wrapper around the Learnova API. Credentials are always
 * included so the httpOnly auth cookies flow with every request.
 * On 401, attempts one refresh + retry (except for auth bootstrap routes).
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const res = await rawFetch(path, options);
  const json = (await res.json().catch(() => null)) as ApiJson<T> | null;

  if (res.status === 401 && !options.skipAuthRefresh && !path.startsWith('/auth/refresh')) {
    const refreshed = await refreshSession();
    if (refreshed) {
      const retry = await rawFetch(path, { ...options, skipAuthRefresh: true });
      const retryJson = (await retry.json().catch(() => null)) as ApiJson<T> | null;
      throwIfFailed(retry, retryJson);
      return retryJson.data;
    }
  }

  throwIfFailed(res, json);
  return json.data;
}

/** Variant that returns both data and pagination meta. */
export async function apiFetchWithMeta<T>(
  path: string,
  options: RequestOptions = {},
): Promise<{ data: T; meta?: Record<string, unknown> }> {
  const res = await rawFetch(path, options);
  const json = (await res.json().catch(() => null)) as ApiJson<T> | null;

  if (res.status === 401 && !options.skipAuthRefresh && !path.startsWith('/auth/refresh')) {
    const refreshed = await refreshSession();
    if (refreshed) {
      const retry = await rawFetch(path, { ...options, skipAuthRefresh: true });
      const retryJson = (await retry.json().catch(() => null)) as ApiJson<T> | null;
      throwIfFailed(retry, retryJson);
      return { data: retryJson.data, meta: retryJson.meta };
    }
  }

  throwIfFailed(res, json);
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

/** Explicitly rotate cookies; returns true when a new session was issued. */
export async function refreshAuthSession(): Promise<boolean> {
  return refreshSession();
}
