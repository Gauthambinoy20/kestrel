import { describe, it, expect } from 'vitest';
import { scan, type ScanConfig } from '../../src/pipeline/scan.js';
import type { HttpClient } from '../../src/net/retry.js';
import type { VerifyClient } from '../../src/enrich/verify.js';

const sourceClient: HttpClient = ({ url }) => {
  if (url.includes('greenhouse')) {
    return Promise.resolve({
      statusCode: 200,
      body: {
        jobs: [
          {
            title: 'Machine Learning Engineer',
            absolute_url: `${url}#job`,
            content: 'pytorch tensorflow llm',
            location: { name: 'Dublin' },
            updated_at: '2026-06-01',
          },
        ],
      },
    });
  }
  if (url.includes('remoteok.com')) return Promise.resolve({ statusCode: 200, body: [{ legal: 'x' }] });
  return Promise.resolve({ statusCode: 200, body: [] });
};

const verifyClient: VerifyClient = () => Promise.resolve({ statusCode: 200, body: 'ok' });

const baseConfig = (over: Partial<ScanConfig> = {}): ScanConfig => ({
  domain: 'ai',
  country: 'IE',
  topN: 5,
  now: '2026-06-06T00:00:00.000Z',
  sourceClient,
  verifyClient,
  maxCompanyBoardsPerSource: 2,
  companyLinkVerifyLimit: 10,
  sleep: () => Promise.resolve(),
  rand: () => 0,
  ...over,
});

describe('scan (integration)', () => {
  it('runs end to end and returns ranked, enriched jobs', async () => {
    const result = await scan(baseConfig());
    expect(result.selectedDomains).toEqual(['AI, Machine Learning and GenAI']);
    expect(result.ranked.length).toBeGreaterThan(0);
    const top = result.ranked[0]!;
    expect(top.domain_slug).toBe('ai_ml_genai');
    expect(top.rank).toBe(1);
    expect(top.link_ok).toBe(true);
    expect(top.apply_ready_score).toBeGreaterThan(0);
    expect(top.score).toBeGreaterThan(0);
  });

  it('reports run diagnostics', async () => {
    const result = await scan(baseConfig());
    expect(result.candidateCount).toBeGreaterThan(0);
    expect(result.matchedCount).toBeGreaterThan(0);
    expect(result.quarantinedCount).toBe(0);
    expect(result.debug.some((d) => d.startsWith('gh:'))).toBe(true);
  });

  it('honours topN', async () => {
    const result = await scan(baseConfig({ topN: 1 }));
    expect(result.ranked).toHaveLength(1);
  });

  it('quarantines malformed source rows without dropping the run', async () => {
    const flaky: HttpClient = ({ url }) =>
      url.includes('greenhouse')
        ? Promise.resolve({ statusCode: 200, body: { jobs: [{ content: 'no title or url' }] } })
        : Promise.resolve({ statusCode: 200, body: [] });
    const result = await scan(baseConfig({ sourceClient: flaky }));
    expect(result.quarantinedCount).toBeGreaterThan(0);
    expect(result.ranked).toHaveLength(0);
  });

  it('returns nothing when no source yields jobs', async () => {
    const empty: HttpClient = () => Promise.resolve({ statusCode: 200, body: [] });
    const result = await scan(baseConfig({ sourceClient: empty }));
    expect(result.ranked).toHaveLength(0);
    expect(result.matchedCount).toBe(0);
  });
});
