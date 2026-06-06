import { describe, it, expect, vi } from 'vitest';
import { verifyJobUrl, type VerifyClient, type VerifyConfig } from '../../src/enrich/verify.js';

const cfg = (client: VerifyClient, overrides: Partial<VerifyConfig> = {}): VerifyConfig => ({
  client,
  retries: 2,
  timeoutMs: 1000,
  retryBaseMs: 50,
  sleep: () => Promise.resolve(),
  rand: () => 0,
  ...overrides,
});

const url = 'https://acme.com/jobs/1';

describe('verifyJobUrl', () => {
  it('reports invalid_url for an unparseable URL', async () => {
    const client = vi.fn();
    const r = await verifyJobUrl('not a url', cfg(client as unknown as VerifyClient));
    expect(r.link_status).toBe('invalid_url');
    expect(r.link_ok).toBe(false);
    expect(client).not.toHaveBeenCalled();
  });

  it('marks a HEAD 200 as live without falling back to GET', async () => {
    const client = vi.fn().mockResolvedValue({ statusCode: 200, body: 'Apply now' });
    const r = await verifyJobUrl(url, cfg(client));
    expect(r).toMatchObject({ link_ok: true, link_status: 'live', link_check_method: 'HEAD' });
    expect(client).toHaveBeenCalledTimes(1);
  });

  it('falls back to GET when HEAD is not allowed', async () => {
    const client = vi.fn(({ method }) =>
      Promise.resolve(method === 'HEAD' ? { statusCode: 405 } : { statusCode: 200, body: 'ok' }),
    );
    const r = await verifyJobUrl(url, cfg(client));
    expect(r.link_ok).toBe(true);
    expect(r.link_check_method).toBe('GET');
  });

  it('detects an expired posting from the body', async () => {
    const client = vi
      .fn()
      .mockResolvedValue({ statusCode: 200, body: 'This position has been filled.' });
    const r = await verifyJobUrl(url, cfg(client));
    expect(r.link_ok).toBe(false);
    expect(r.link_status).toBe('expired_or_closed');
  });

  it('reports http_<code> for a 404', async () => {
    const client = vi.fn().mockResolvedValue({ statusCode: 404, body: 'gone baby' });
    const r = await verifyJobUrl(url, cfg(client));
    // 404 triggers a GET fallback too; both 404 -> http_404
    expect(r.link_ok).toBe(false);
    expect(r.link_status).toBe('http_404');
  });

  it('retries a retryable status then succeeds', async () => {
    const client = vi
      .fn()
      .mockResolvedValueOnce({ statusCode: 503 })
      .mockResolvedValueOnce({ statusCode: 200, body: 'ok' });
    const r = await verifyJobUrl(url, cfg(client));
    expect(r.link_ok).toBe(true);
    expect(r.link_attempts).toBe(2);
  });

  it('uses the response final URL (redirects)', async () => {
    const client = vi
      .fn()
      .mockResolvedValue({ statusCode: 200, body: 'ok', finalUrl: 'https://acme.com/final' });
    const r = await verifyJobUrl(url, cfg(client));
    expect(r.final_url).toBe('https://acme.com/final');
  });

  it('captures failure when every attempt throws', async () => {
    const client = vi.fn().mockRejectedValue(new Error('timeout'));
    const r = await verifyJobUrl(url, cfg(client, { retries: 1 }));
    expect(r.link_ok).toBe(false);
    expect(r.link_error).toContain('timeout');
  });
});
