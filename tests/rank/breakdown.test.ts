import { describe, it, expect } from 'vitest';
import { scoreBreakdown } from '../../src/rank/breakdown.js';
import { deterministicScore } from '../../src/rank/rank.js';

describe('scoreBreakdown', () => {
  it('breaks the score into apply-readiness, match, source and live parts', () => {
    const job = {
      apply_ready_score: 90,
      match_score: 80,
      source_quality: 'direct_ats_board',
      link_ok: true,
    };
    const b = scoreBreakdown(job);
    expect(b.applyReadiness).toBe(Math.round(90 * 0.62));
    expect(b.match).toBe(Math.round(80 * 0.32));
    expect(b.sourceBonus).toBe(5);
    expect(b.liveBonus).toBe(4);
    expect(b.total).toBe(deterministicScore(job));
  });

  it('uses a smaller source bonus for AI-scraped pages and none otherwise', () => {
    expect(scoreBreakdown({ source_quality: 'ai_scraped_company_page' }).sourceBonus).toBe(3);
    expect(scoreBreakdown({ source_quality: 'aggregator' }).sourceBonus).toBe(0);
  });

  it('is all zero for an empty job', () => {
    expect(scoreBreakdown({})).toEqual({
      applyReadiness: 0,
      match: 0,
      sourceBonus: 0,
      liveBonus: 0,
      total: 0,
    });
  });

  it('total always equals deterministicScore', () => {
    const jobs = [
      { apply_ready_score: 50, match_score: 50, link_ok: true },
      { apply_ready_score: 100, match_score: 100, source_quality: 'direct_ats_board', link_ok: true },
      { match_score: 30 },
    ];
    for (const job of jobs) expect(scoreBreakdown(job).total).toBe(deterministicScore(job));
  });
});
