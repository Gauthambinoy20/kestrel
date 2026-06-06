import { describe, it, expect } from 'vitest';
import { renderResult, renderSummary } from '../../src/runtime/render.js';
import type { ScanResult } from '../../src/pipeline/scan.js';

const result: ScanResult = {
  ranked: [
    {
      rank: 1,
      score: 88,
      reason: 'verified live link',
      company: 'Stripe',
      title: 'Backend Engineer',
      url: 'https://a/1',
      apply_ready_score: 90,
      link_status: 'live',
      // remaining EnrichedJob fields are not needed by the digest renderer
    } as unknown as ScanResult['ranked'][number],
  ],
  selectedDomains: ['AI, Machine Learning and GenAI'],
  candidateCount: 12,
  quarantinedCount: 1,
  matchedCount: 3,
  debug: ['gh:stripe:1', 'remoteok:0'],
};

describe('renderResult', () => {
  it('renders a digest by default', () => {
    const out = renderResult(result, { json: false, country: 'IE', date: '2026-06-06' });
    expect(out).toContain('TOP 1 - AI, Machine Learning and GenAI - IE - 2026-06-06');
    expect(out).toContain('Stripe - Backend Engineer');
  });

  it('renders parseable JSON when asked', () => {
    const out = renderResult(result, { json: true, country: 'IE', date: '2026-06-06' });
    const parsed = JSON.parse(out) as ScanResult;
    expect(parsed.matchedCount).toBe(3);
    expect(parsed.ranked).toHaveLength(1);
  });

  it('falls back to "all" when no domain label is present', () => {
    const out = renderResult({ ...result, selectedDomains: [] }, { json: false, country: 'IE', date: 'd' });
    expect(out).toContain('TOP 1 - all - IE - d');
  });
});

describe('renderSummary', () => {
  it('summarises the pipeline counts', () => {
    expect(renderSummary(result)).toBe(
      '1 ranked · 3 matched · 1 quarantined · 12 candidates · 2 sources',
    );
  });
});
