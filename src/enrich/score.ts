/** The signals that feed the apply-readiness score. */
export interface ApplyReadyInput {
  readonly match_score?: number | null | undefined;
  readonly link_ok?: boolean | undefined;
  readonly source_quality?: string | undefined;
  readonly company_domain?: string | undefined;
  readonly final_url?: string | undefined;
  readonly url?: string | undefined;
}

/** Points added per source-quality tier. */
const SOURCE_QUALITY_POINTS: Record<string, number> = {
  direct_ats_board: 15,
  ai_scraped_company_page: 10,
  remote_board: 8,
  aggregator: 3,
};

/**
 * Compute a 0–100 "apply-readiness" score: how worthwhile it is to act on a job
 * now. Domain match contributes up to 45 points; a verified-live link 30; the
 * source-quality tier up to 15; a known company domain 5; and a redirect to a
 * resolved final URL 5. The result is clamped and rounded.
 */
export function calcApplyReadyScore(job: ApplyReadyInput): number {
  let score = Math.min(45, Math.max(0, Number(job.match_score ?? 0) * 0.45));
  if (job.link_ok) score += 30;
  score += SOURCE_QUALITY_POINTS[job.source_quality ?? ''] ?? 0;
  if (job.company_domain) score += 5;
  if (job.final_url && job.final_url !== job.url) score += 5;
  return Math.max(0, Math.min(100, Math.round(score)));
}
