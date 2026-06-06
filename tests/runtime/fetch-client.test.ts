import { describe, it, expect, vi, afterEach } from 'vitest';
import { buildUrl, createFetchClient, createVerifyClient } from '../../src/runtime/fetch-client.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('buildUrl', () => {
  it('returns the base URL unchanged with no query', () => {
    expect(buildUrl('https://a.com/x')).toBe('https://a.com/x');
  });
  it('appends query params, skipping nullish values', () => {
    const url = buildUrl('https://a.com/s', { q: 'AI Engineer', n: 5, skip: undefined });
    expect(url).toContain('q=AI+Engineer');
    expect(url).toContain('n=5');
    expect(url).not.toContain('skip');
  });
});

describe('createFetchClient', () => {
  it('issues a request and parses a JSON body', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      text: () => Promise.resolve('{"jobs":[1,2]}'),
    });
    vi.stubGlobal('fetch', fetchMock);
    const client = createFetchClient();
    const res = await client({ url: 'https://a.com/api', qs: { p: 1 } });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ jobs: [1, 2] });
    const calledUrl = fetchMock.mock.calls[0]![0] as string;
    expect(calledUrl).toContain('p=1');
  });

  it('keeps a non-JSON body as text', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ status: 503, text: () => Promise.resolve('Service Down') }),
    );
    const res = await createFetchClient()({ url: 'https://a.com' });
    expect(res.statusCode).toBe(503);
    expect(res.body).toBe('Service Down');
  });

  it('serialises a JSON body for POST', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ status: 200, text: () => Promise.resolve('{}') });
    vi.stubGlobal('fetch', fetchMock);
    await createFetchClient()({ url: 'https://a.com', method: 'POST', body: { a: 1 } });
    const init = fetchMock.mock.calls[0]![1] as { method: string; body: string };
    expect(init.method).toBe('POST');
    expect(init.body).toBe('{"a":1}');
  });
});

describe('createVerifyClient', () => {
  it('returns status, final URL and (for GET) a body snippet', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 200,
        url: 'https://a.com/final',
        text: () => Promise.resolve('x'.repeat(5000)),
      }),
    );
    const res = await createVerifyClient()({ url: 'https://a.com', method: 'GET', timeout: 1000 });
    expect(res.statusCode).toBe(200);
    expect(res.finalUrl).toBe('https://a.com/final');
    expect(typeof res.body).toBe('string');
    expect((res.body as string).length).toBe(2000);
  });

  it('does not read a body for HEAD', async () => {
    const text = vi.fn().mockResolvedValue('should not be read');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 200, url: 'https://a.com', text }));
    const res = await createVerifyClient()({ url: 'https://a.com', method: 'HEAD', timeout: 1000 });
    expect(res.body).toBe('');
    expect(text).not.toHaveBeenCalled();
  });
});
