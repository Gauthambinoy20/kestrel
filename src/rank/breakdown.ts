import { deterministicScore, type RankSignals } from './rank.js';

/** The component contributions behind a job's deterministic score. */
export interface ScoreBreakdown {
  readonly applyReadiness: number;
  readonly match: number;
  readonly sourceBonus: number;
  readonly liveBonus: number;
  readonly total: number;
}

function num(value: number | null | undefined): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Break a job's deterministic score into its contributing parts, so a digest or
 * UI can explain *why* a job ranked where it did rather than just showing a
 * number. `total` matches {@link deterministicScore} exactly.
 */
export function scoreBreakdown(job: RankSignals): ScoreBreakdown {
  const sourceBonus =
    job.source_quality === 'direct_ats_board'
      ? 5
      : job.source_quality === 'ai_scraped_company_page'
        ? 3
        : 0;
  return {
    applyReadiness: Math.round(num(job.apply_ready_score) * 0.62),
    match: Math.round(num(job.match_score) * 0.32),
    sourceBonus,
    liveBonus: job.link_ok ? 4 : 0,
    total: deterministicScore(job),
  };
}
