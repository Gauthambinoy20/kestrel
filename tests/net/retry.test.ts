import { describe, it, expect, vi } from 'vitest';
import {
  isRetryableStatus,
  retryDelayMs,
  statusFromResponse,
  bodyFromResponse,
  safeRequest,
  type HttpResponseLike,
  type SafeRequestConfig,
} from '../../src/net/retry.js';

const noSleep = (): Promise<void> => Promise.resolve();
const baseConfig = (
  client: SafeRequestConfig['client'],
  overrides: Partial<SafeRequestConfig> = {},
): SafeRequestConfig => ({
  retries: 2,
  timeoutMs: 1000,
  retryBaseMs: 100,
  client,
  sleep: noSleep,
  rand: () => 0,
  ...overrides,
});

describe('isRetryableStatus', () => {
  it.each([408, 425, 429, 500, 502, 503, 504])('retries %i', (s) => {
    expect(isRetryableStatus(s)).toBe(true);
  });
  it.each([200, 301, 400, 401, 403, 404, 0])('does not retry %i', (s) => {
    expect(isRetryableStatus(s)).toBe(false);
  });
});

describe('retryDelayMs', () => {
  it('grows exponentially from the base', () => {
    expect(retryDelayMs(1, 100, () => 0)).toBe(100);
    expect(retryDelayMs(2, 100, () => 0)).toBe(200);
    expect(retryDelayMs(3, 100, () => 0)).toBe(400);
  });
  it('caps at 15s', () => {
    expect(retryDelayMs(20, 1000, () => 0)).toBe(15000);
  });
  it('adds jitter bounded by min(500, base)', () => {
    expect(retryDelayMs(1, 100, () => 1)).toBe(100 + Math.floor(1 * 100));
  });
});

describe('statusFromResponse', () => {
  it('prefers statusCode, then status, then body fields', () => {
    expect(statusFromResponse({ statusCode: 200 })).toBe(200);
    expect(statusFromResponse({ status: 404 })).toBe(404);
    expect(statusFromResponse({ body: { statusCode: 503 } })).toBe(503);
    expect(statusFromResponse({ body: { error: { status: 429 } } })).toBe(429);
  });
  it('returns 0 when no status is present', () => {
    expect(statusFromResponse({ body: { jobs: [] } })).toBe(0);
  });
});

describe('bodyFromResponse', () => {
  it('unwraps body when present', () => {
    expect(bodyFromResponse({ body: { a: 1 } })).toEqual({ a: 1 });
  });
  it('returns the response itself when there is no body key', () => {
    const res: HttpResponseLike = { statusCode: 200 };
    expect(bodyFromResponse(res)).toBe(res);
  });
});

describe('safeRequest', () => {
  it('succeeds on the first attempt and returns the body', async () => {
    const client = vi.fn().mockResolvedValue({ statusCode: 200, body: { jobs: [1] } });
    const r = await safeRequest('gh:acme', { url: 'u' }, baseConfig(client));
    expect(r).toMatchObject({ source: 'gh:acme', ok: true, status: 200, attempts: 1 });
    expect(r.data).toEqual({ jobs: [1] });
    expect(client).toHaveBeenCalledTimes(1);
  });

  it('treats a missing status as ok (keyless boards return arrays)', async () => {
    const client = vi.fn().mockResolvedValue({ body: [1, 2, 3] });
    const r = await safeRequest('lever:acme', { url: 'u' }, baseConfig(client));
    expect(r.ok).toBe(true);
    expect(r.status).toBe(0);
  });

  it('retries a retryable status then succeeds', async () => {
    const client = vi
      .fn()
      .mockResolvedValueOnce({ statusCode: 503 })
      .mockResolvedValueOnce({ statusCode: 200, body: 'ok' });
    const r = await safeRequest('x', { url: 'u' }, baseConfig(client));
    expect(r.ok).toBe(true);
    expect(r.attempts).toBe(2);
    expect(client).toHaveBeenCalledTimes(2);
  });

  it('exhausts retries on persistent 500s', async () => {
    const client = vi.fn().mockResolvedValue({ statusCode: 500 });
    const r = await safeRequest('x', { url: 'u' }, baseConfig(client));
    expect(r.ok).toBe(false);
    expect(r.status).toBe(500);
    expect(r.error).toBe('http_500');
    expect(client).toHaveBeenCalledTimes(3); // 1 + 2 retries
  });

  it('does not retry a non-retryable status', async () => {
    const client = vi.fn().mockResolvedValue({ statusCode: 404 });
    const r = await safeRequest('x', { url: 'u' }, baseConfig(client));
    expect(r.ok).toBe(false);
    expect(r.error).toBe('http_404');
    expect(client).toHaveBeenCalledTimes(1);
  });

  it('retries a thrown error then succeeds', async () => {
    const client = vi
      .fn()
      .mockRejectedValueOnce(new Error('ECONNRESET'))
      .mockResolvedValueOnce({ statusCode: 200, body: 'ok' });
    const r = await safeRequest('x', { url: 'u' }, baseConfig(client));
    expect(r.ok).toBe(true);
    expect(r.attempts).toBe(2);
  });

  it('captures the error when every attempt throws', async () => {
    const client = vi.fn().mockRejectedValue(new Error('boom'));
    const r = await safeRequest('x', { url: 'u' }, baseConfig(client, { retries: 1 }));
    expect(r.ok).toBe(false);
    expect(r.error).toContain('boom');
    expect(client).toHaveBeenCalledTimes(2);
  });
});
