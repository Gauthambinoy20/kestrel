import { describe, it, expect, vi } from 'vitest';
import { runSources, type RunSourcesConfig } from '../../src/sources/run.js';
import type { SourceRequest } from '../../src/sources/plan.js';
import type { HttpClient } from '../../src/net/retry.js';

const cfg = (client: HttpClient): RunSourcesConfig => ({
  client,
  concurrency: 4,
  retries: 1,
  timeoutMs: 1000,
  retryBaseMs: 10,
  sleep: () => Promise.resolve(),
  rand: () => 0,
});

const ghReq: SourceRequest = {
  name: 'gh:acme',
  kind: 'greenhouse',
  company: 'acme',
  options: { method: 'GET', url: 'https://boards-api.greenhouse.io/v1/boards/acme/jobs?content=true' },
};
const remoteReq: SourceRequest = {
  name: 'remoteok',
  kind: 'remoteok',
  options: { method: 'GET', url: 'https://remoteok.com/api' },
};

describe('runSources', () => {
  it('parses successful responses and traces counts', async () => {
    const client: HttpClient = ({ url }) => {
      if (url.includes('greenhouse')) {
        return Promise.resolve({
          statusCode: 200,
          body: { jobs: [{ title: 'ML Engineer', absolute_url: 'https://g/1' }] },
        });
      }
      return Promise.resolve({
        statusCode: 200,
        body: [{ legal: 'x' }, { position: 'SRE', url: 'https://r/1' }],
      });
    };
    const { candidates, debug } = await runSources([ghReq, remoteReq], cfg(vi.fn(client)));
    expect(candidates).toHaveLength(2);
    expect(candidates.map((c) => c.source).sort()).toEqual(['gh:acme', 'remoteok']);
    expect(debug).toContain('gh:acme:1');
    expect(debug).toContain('remoteok:1');
  });

  it('logs a failed source and yields no candidates for it', async () => {
    const client: HttpClient = () => Promise.resolve({ statusCode: 500 });
    const { candidates, debug } = await runSources([ghReq], cfg(vi.fn(client)));
    expect(candidates).toHaveLength(0);
    expect(debug[0]).toMatch(/^gh:acme:ERR:500:a/);
  });

  it('routes each kind to the correct parser', async () => {
    const adzunaReq: SourceRequest = {
      name: 'adzuna:AI:p1',
      kind: 'adzuna',
      options: { method: 'GET', url: 'https://api.adzuna.com/x' },
    };
    const client: HttpClient = () =>
      Promise.resolve({
        statusCode: 200,
        body: { results: [{ title: 'Data Engineer', redirect_url: 'https://a/1' }] },
      });
    const { candidates } = await runSources([adzunaReq], cfg(vi.fn(client)));
    expect(candidates[0]?.source).toBe('adzuna');
    expect(candidates[0]?.title).toBe('Data Engineer');
  });

  it('does not pre-filter malformed candidates (left for the validation gate)', async () => {
    const client: HttpClient = () =>
      Promise.resolve({ statusCode: 200, body: { jobs: [{ location: { name: 'Dublin' } }] } });
    const { candidates } = await runSources([ghReq], cfg(vi.fn(client)));
    // a job with no title/url is still emitted here; validateRawJobs quarantines it later
    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.title).toBeUndefined();
  });

  it('returns empty results for no requests', async () => {
    const { candidates, debug } = await runSources([], cfg(vi.fn()));
    expect(candidates).toEqual([]);
    expect(debug).toEqual([]);
  });
});
