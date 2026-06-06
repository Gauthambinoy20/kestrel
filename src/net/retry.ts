import { z } from 'zod';

const RecordSchema = z.record(z.unknown());

function record(value: unknown): Record<string, unknown> {
  const parsed = RecordSchema.safeParse(value);
  return parsed.success ? parsed.data : {};
}

/** HTTP status codes worth retrying: transient throttling and gateway errors. */
const RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

/** Whether a status code should trigger a retry. */
export function isRetryableStatus(status: number): boolean {
  return RETRYABLE_STATUSES.has(Number(status));
}

/**
 * Exponential backoff with jitter, capped at 15s. `rand` is injectable so the
 * delay is deterministic in tests.
 */
export function retryDelayMs(attempt: number, baseMs: number, rand: () => number = Math.random): number {
  const jitter = Math.floor(rand() * Math.min(500, baseMs));
  return Math.min(15000, baseMs * Math.pow(2, attempt - 1) + jitter);
}

/** A minimal HTTP response shape (compatible with n8n's httpRequest). */
export interface HttpResponseLike {
  statusCode?: number;
  status?: number;
  body?: unknown;
}

/** A normalised HTTP request the injected client must perform. */
export interface HttpRequestOptions {
  method?: string;
  url: string;
  qs?: Record<string, unknown>;
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
}

/** The injected transport. Adapters (n8n, fetch) implement this. */
export type HttpClient = (options: HttpRequestOptions) => Promise<HttpResponseLike>;

/** The outcome of a guarded source request. */
export interface SourceResult {
  source: string;
  ok: boolean;
  status: number;
  attempts: number;
  data?: unknown;
  error: string;
}

/** Configuration for {@link safeRequest}. */
export interface SafeRequestConfig {
  retries: number;
  timeoutMs: number;
  retryBaseMs: number;
  client: HttpClient;
  sleep?: (ms: number) => Promise<void>;
  rand?: () => number;
}

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/** Extract a numeric status from various response/body shapes; 0 if none. */
export function statusFromResponse(res: HttpResponseLike): number {
  const body = record(res.body);
  const errorRec = record(body.error);
  const raw =
    res.statusCode || res.status || body.statusCode || body.status || errorRec.status || 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

/** Unwrap the response body when present, else return the response itself. */
export function bodyFromResponse(res: HttpResponseLike): unknown {
  return Object.prototype.hasOwnProperty.call(res, 'body') ? res.body : res;
}

/**
 * Perform an HTTP request with retries, backoff and full failure capture. A
 * retryable status (or a thrown error) is retried up to `retries` times; any
 * other outcome returns immediately. The result always reports ok/status/
 * attempts so a failed source is recorded rather than throwing — one dead
 * source never stops a scan.
 */
export async function safeRequest(
  name: string,
  options: HttpRequestOptions,
  config: SafeRequestConfig,
): Promise<SourceResult> {
  const { retries, timeoutMs, retryBaseMs, client } = config;
  const sleep = config.sleep ?? defaultSleep;
  const rand = config.rand ?? Math.random;
  let lastError = '';
  let lastStatus = 0;

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const res = await client({ ...options, timeout: timeoutMs });
      const status = statusFromResponse(res);
      lastStatus = status;
      if (isRetryableStatus(status) && attempt <= retries) {
        await sleep(retryDelayMs(attempt, retryBaseMs, rand));
        continue;
      }
      const ok = !status || (status >= 200 && status < 400);
      return {
        source: name,
        ok,
        status,
        attempts: attempt,
        data: bodyFromResponse(res),
        error: ok ? '' : `http_${status || 'error'}`,
      };
    } catch (err) {
      lastError = String(err).slice(0, 200);
      if (attempt <= retries) {
        await sleep(retryDelayMs(attempt, retryBaseMs, rand));
        continue;
      }
    }
  }

  return {
    source: name,
    ok: false,
    status: lastStatus,
    attempts: retries + 1,
    error: lastError || `http_${lastStatus || 'error'}`,
  };
}
