import { describe, it, expect } from 'vitest';
import {
  createFixtureSourceClient,
  createFixtureVerifyClient,
} from '../../src/runtime/fixture-client.js';

describe('createFixtureSourceClient', () => {
  const client = createFixtureSourceClient([
    { match: 'greenhouse', body: { jobs: [{ title: 'ML Engineer', absolute_url: 'https://g/1' }] } },
    { match: 'remoteok.com', body: [{ legal: 'x' }], status: 200 },
  ]);

  it('replays a fixture matched by URL substring', async () => {
    const res = await client({ url: 'https://boards-api.greenhouse.io/v1/boards/acme/jobs' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ jobs: [{ title: 'ML Engineer', absolute_url: 'https://g/1' }] });
  });

  it('returns an empty 200 for an unmatched URL', async () => {
    const res = await client({ url: 'https://api.lever.co/v0/postings/x' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('createFixtureVerifyClient', () => {
  it('reports every link as live with its URL as final', async () => {
    const res = await createFixtureVerifyClient()({
      url: 'https://a.com',
      method: 'HEAD',
      timeout: 1000,
    });
    expect(res.statusCode).toBe(200);
    expect(res.finalUrl).toBe('https://a.com');
  });
});
