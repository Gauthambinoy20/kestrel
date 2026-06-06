import { describe, it, expect } from 'vitest';
import { calcApplyReadyScore } from '../../src/enrich/score.js';

describe('calcApplyReadyScore', () => {
  it('returns 0 for an empty job', () => {
    expect(calcApplyReadyScore({})).toBe(0);
  });

  it('caps a perfect job at 100', () => {
    expect(
      calcApplyReadyScore({
        match_score: 100,
        link_ok: true,
        source_quality: 'direct_ats_board',
        company_domain: 'stripe.com',
        final_url: 'https://stripe.com/final',
        url: 'https://boards.greenhouse.io/stripe/1',
      }),
    ).toBe(100);
  });

  it('weights match score at 0.45 up to 45', () => {
    expect(calcApplyReadyScore({ match_score: 100 })).toBe(45);
    expect(calcApplyReadyScore({ match_score: 60 })).toBe(27);
  });

  it('adds 30 for a live link', () => {
    expect(calcApplyReadyScore({ link_ok: true })).toBe(30);
  });

  it.each([
    ['direct_ats_board', 15],
    ['ai_scraped_company_page', 10],
    ['remote_board', 8],
    ['aggregator', 3],
    ['unknown', 0],
    [undefined, 0],
  ])('adds source-quality points for %s', (quality, expected) => {
    expect(calcApplyReadyScore({ source_quality: quality })).toBe(expected);
  });

  it('adds 5 for a known company domain', () => {
    expect(calcApplyReadyScore({ company_domain: 'acme.com' })).toBe(5);
  });

  it('adds 5 only when the final URL differs from the original', () => {
    expect(calcApplyReadyScore({ final_url: 'https://a/x', url: 'https://a/x' })).toBe(0);
    expect(calcApplyReadyScore({ final_url: 'https://a/y', url: 'https://a/x' })).toBe(5);
  });

  it('treats null/undefined match score as zero', () => {
    expect(calcApplyReadyScore({ match_score: null })).toBe(0);
    expect(calcApplyReadyScore({ match_score: undefined, link_ok: true })).toBe(30);
  });

  it('never returns a negative score', () => {
    expect(calcApplyReadyScore({ match_score: -50 })).toBe(0);
  });
});
