/** The signals the deterministic ranker reads from a job. */
export interface RankSignals {
  readonly apply_ready_score?: number | null | undefined;
  readonly match_score?: number | null | undefined;
  readonly source_quality?: string | undefined;
  readonly link_ok?: boolean | undefined;
  readonly matched_role?: string | undefined;
  readonly keyword_hits?: string | undefined;
}

/** A job with its rank position, score and human-readable reason. */
export type Ranked<T> = T & { rank: number; score: number; reason: string };

function num(value: number | null | undefined): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Deterministic, explainable local ranking score (0–100): apply-readiness
 * dominates (0.62), domain match supports it (0.32), with small bonuses for a
 * direct ATS/company-page source and a verified-live link. No paid LLM — the
 * ordering is reproducible and free.
 */
export function deterministicScore(job: RankSignals): number {
  const sourceBonus =
    job.source_quality === 'direct_ats_board'
      ? 5
      : job.source_quality === 'ai_scraped_company_page'
        ? 3
        : 0;
  const liveBonus = job.link_ok ? 4 : 0;
  const score = num(job.apply_ready_score) * 0.62 + num(job.match_score) * 0.32 + sourceBonus + liveBonus;
  return Math.max(0, Math.min(100, Math.round(score)));
}

/** Build a short, human-readable explanation of why a job ranked where it did. */
export function deterministicReason(job: RankSignals): string {
  const parts: string[] = [];
  if (job.link_ok) parts.push('verified live link');
  if (job.source_quality === 'direct_ats_board') parts.push('direct company board');
  if (job.matched_role) parts.push(`matched ${job.matched_role}`);
  if (job.keyword_hits) parts.push(`keywords: ${job.keyword_hits}`);
  return parts.length > 0 ? parts.join(', ') : 'best available local match';
}

/**
 * Rank jobs by deterministic score (then apply-readiness, then match score as
 * tie-breakers), keep the top N, and stamp each with its 1-based rank, score
 * and reason.
 */
export function rankJobs<T extends RankSignals>(jobs: readonly T[], topN: number): Ranked<T>[] {
  return [...jobs]
    .sort(
      (a, b) =>
        deterministicScore(b) - deterministicScore(a) ||
        num(b.apply_ready_score) - num(a.apply_ready_score) ||
        num(b.match_score) - num(a.match_score),
    )
    .slice(0, Math.max(0, topN))
    .map((job, index) => ({
      ...job,
      rank: index + 1,
      score: deterministicScore(job),
      reason: deterministicReason(job),
    }));
}
