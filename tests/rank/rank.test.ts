import { describe, it, expect } from 'vitest';
import { deterministicScore, deterministicReason, rankJobs } from '../../src/rank/rank.js';

describe('deterministicScore', () => {
  it('weights apply-readiness and match score with bonuses, capped at 100', () => {
    expect(
      deterministicScore({
        apply_ready_score: 100,
        match_score: 100,
        source_quality: 'direct_ats_board',
        link_ok: true,
      }),
    ).toBe(100);
  });

  it('weights apply-readiness at 0.62 and match at 0.32', () => {
    // 50*0.62 + 50*0.32 = 47, no bonuses
    expect(deterministicScore({ apply_ready_score: 50, match_score: 50 })).toBe(47);
  });

  it('adds source bonuses by tier', () => {
    expect(deterministicScore({ source_quality: 'direct_ats_board' })).toBe(5);
    expect(deterministicScore({ source_quality: 'ai_scraped_company_page' })).toBe(3);
    expect(deterministicScore({ source_quality: 'aggregator' })).toBe(0);
  });

  it('adds a live-link bonus', () => {
    expect(deterministicScore({ link_ok: true })).toBe(4);
  });

  it('treats missing scores as zero', () => {
    expect(deterministicScore({})).toBe(0);
  });
});

describe('deterministicReason', () => {
  it('lists the contributing signals', () => {
    expect(
      deterministicReason({
        link_ok: true,
        source_quality: 'direct_ats_board',
        matched_role: 'ML Engineer',
        keyword_hits: 'pytorch',
      }),
    ).toBe('verified live link, direct company board, matched ML Engineer, keywords: pytorch');
  });

  it('falls back when there is nothing to say', () => {
    expect(deterministicReason({})).toBe('best available local match');
  });
});

describe('rankJobs', () => {
  const jobs = [
    { id: 'a', apply_ready_score: 20, match_score: 20 },
    { id: 'b', apply_ready_score: 90, match_score: 80, link_ok: true },
    { id: 'c', apply_ready_score: 50, match_score: 50 },
  ];

  it('orders by score descending and assigns 1-based ranks', () => {
    const ranked = rankJobs(jobs, 10);
    expect(ranked.map((j) => j.id)).toEqual(['b', 'c', 'a']);
    expect(ranked.map((j) => j.rank)).toEqual([1, 2, 3]);
  });

  it('keeps only the top N', () => {
    expect(rankJobs(jobs, 2)).toHaveLength(2);
  });

  it('stamps each job with score and reason', () => {
    const [top] = rankJobs(jobs, 1);
    expect(top!.score).toBeGreaterThan(0);
    expect(typeof top!.reason).toBe('string');
  });

  it('returns an empty array for topN <= 0 or no jobs', () => {
    expect(rankJobs(jobs, 0)).toEqual([]);
    expect(rankJobs([], 5)).toEqual([]);
  });

  it('does not mutate the input array', () => {
    const copy = [...jobs];
    rankJobs(jobs, 3);
    expect(jobs).toEqual(copy);
  });
});
