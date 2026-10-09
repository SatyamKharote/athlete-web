import type { ApiErrorBody } from './types';

const BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');

export class ApiError extends Error {
  readonly status: number;
  /** Every message the server returned (validation errors arrive as an array). */
  readonly messages: string[];
  /** Short error name from the server, e.g. "Bad Request". */
  readonly error: string;

  constructor(status: number, messages: string[], error: string) {
    super(messages[0] ?? error);
    this.name = 'ApiError';
    this.status = status;
    this.messages = messages;
    this.error = error;
  }

  /** 0 means the request never got a response (offline, DNS, CORS…). */
  get isNetworkError(): boolean {
    return this.status === 0;
  }
}

export type QueryParams = Record<string, string | number | undefined | null>;

/** Builds a query string, omitting undefined/null/empty-string values. */
export function buildQuery(params: QueryParams = {}): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    const str = String(value).trim();
    if (str === '') continue;
    search.set(key, str);
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  query?: QueryParams;
  body?: unknown;
  signal?: AbortSignal;
}

function isErrorBody(value: unknown): value is ApiErrorBody {
  return typeof value === 'object' && value !== null && 'message' in value;
}

export function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError';
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', query, body, signal } = options;
  const url = `${BASE_URL}${path}${buildQuery(query)}`;

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (err) {
    // Let aborts propagate untouched so callers can ignore them.
    if (isAbortError(err)) throw err;
    throw new ApiError(
      0,
      ['Unable to reach the server. Check your connection and try again.'],
      'Network Error',
    );
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  let payload: unknown = undefined;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    if (isErrorBody(payload)) {
      const messages = Array.isArray(payload.message) ? payload.message : [payload.message];
      throw new ApiError(response.status, messages, payload.error ?? response.statusText);
    }
    const fallback =
      typeof payload === 'string' && payload ? payload : `Request failed (${response.status})`;
    throw new ApiError(response.status, [fallback], response.statusText || 'Error');
  }

  return payload as T;
}

/** Human-readable message for any thrown value. */
export function getErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.messages.join(' ');
  if (err instanceof Error) return err.message;
  return 'Something went wrong.';
}
