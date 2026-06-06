import type { HttpClient, HttpRequestOptions, HttpResponseLike } from '../net/retry.js';
import type { VerifyClient, VerifyHttpResponse } from '../enrich/verify.js';

/** Append a query-string object to a base URL, skipping nullish values. */
export function buildUrl(base: string, qs?: Record<string, unknown>): string {
  if (!qs) return base;
  const url = new URL(base);
  for (const [key, value] of Object.entries(qs)) {
    if (value === undefined || value === null) continue;
    const str =
      typeof value === 'string'
        ? value
        : typeof value === 'number' || typeof value === 'boolean'
          ? String(value)
          : JSON.stringify(value);
    url.searchParams.set(key, str);
  }
  return url.toString();
}

function parseBody(text: string): unknown {
  if (text.length === 0) return '';
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function withTimeout<T>(
  timeout: number | undefined,
  run: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  const timer = timeout ? setTimeout(() => controller.abort(), timeout) : undefined;
  try {
    return await run(controller.signal);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** A real HTTP client backed by global fetch, for the source-scrape stage. */
export function createFetchClient(): HttpClient {
  return (options: HttpRequestOptions): Promise<HttpResponseLike> =>
    withTimeout(options.timeout, async (signal) => {
      const init: RequestInit = { method: options.method ?? 'GET', signal };
      if (options.headers) init.headers = options.headers;
      if (options.body !== undefined) init.body = JSON.stringify(options.body);
      const res = await fetch(buildUrl(options.url, options.qs), init);
      const text = await res.text();
      return { statusCode: res.status, body: parseBody(text) };
    });
}

/** A real verify client backed by global fetch, for link checking. */
export function createVerifyClient(): VerifyClient {
  return (options): Promise<VerifyHttpResponse> =>
    withTimeout(options.timeout, async (signal) => {
      const res = await fetch(options.url, {
        method: options.method,
        redirect: 'follow',
        headers: {
          'User-Agent': 'kestrel-link-verifier/1.0',
          Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
        },
        signal,
      });
      const body = options.method === 'GET' ? (await res.text()).slice(0, 2000) : '';
      return { statusCode: res.status, body, finalUrl: res.url };
    });
}
