import type { EnrichedDomain } from '../domains/types.js';
import type { RawJob } from '../sources/types.js';
import { dedupeByUrl } from '../sources/dedup.js';
import { jobSeniorityBlocked } from '../matching/seniority.js';
import { matchJobToDomains, type DomainMatch } from '../matching/match.js';
import { normalizeText } from '../text/normalize.js';
import { stableHash } from '../util/hash.js';

/** Inputs the assembly stage needs beyond the raw jobs themselves. */
export interface AssembleContext {
  readonly selectedDomains: readonly EnrichedDomain[];
  readonly country: string;
  /** Location used when a job has none (e.g. the country's display name). */
  readonly defaultLocation: string;
  readonly telegramChatId?: string;
  readonly blocklist?: readonly string[];
  /** ISO timestamp used as the posted-at fallback (injected for determinism). */
  readonly now: string;
}

/** A fully assembled, matched job ready for verification and ranking. */
export interface AssembledJob extends DomainMatch {
  readonly hash: string;
  readonly country: string;
  readonly telegram_chat_id: string;
  readonly source: string;
  readonly title: string;
  readonly title_normalized: string;
  readonly company: string;
  readonly location: string;
  readonly remote_type: 'remote' | null;
  readonly url: string;
  readonly jd_text: string;
  readonly raw_payload: unknown;
  readonly posted_at: string;
  readonly filter_status: 'passed';
  readonly keyword_score: number;
}

const JD_MAX_CHARS = 4000;

/**
 * Turn raw scraped jobs into ranked, matched job records: de-duplicate by URL,
 * drop senior/management titles, match each survivor to the best domain, and
 * build the canonical record (stable hash, normalised title, remote detection,
 * truncated description, fallbacks for missing company/location/posted-at).
 * Results are sorted by match score, then keyword score, descending.
 */
export function assembleJobs(rawJobs: readonly RawJob[], ctx: AssembleContext): AssembledJob[] {
  const blocklist = ctx.blocklist ?? [];
  const primarySlug = ctx.selectedDomains[0]?.slug;
  const assembled: AssembledJob[] = [];

  for (const job of dedupeByUrl(rawJobs)) {
    if (jobSeniorityBlocked(job.title, primarySlug, blocklist)) continue;
    const match = matchJobToDomains(job, ctx.selectedDomains);
    if (!match) continue;

    assembled.push({
      ...match,
      hash: stableHash(job.url),
      country: ctx.country,
      telegram_chat_id: ctx.telegramChatId ?? '',
      source: job.source,
      title: job.title,
      title_normalized: normalizeText(job.title),
      company: job.company || 'Unknown',
      location: job.location || ctx.defaultLocation,
      remote_type: /remote/i.test(`${job.location ?? ''} ${job.title}`) ? 'remote' : null,
      url: job.url,
      jd_text: (job.jd_text ?? '').slice(0, JD_MAX_CHARS),
      raw_payload: job.raw ?? job,
      posted_at: job.posted_at || ctx.now,
      filter_status: 'passed',
      keyword_score: Math.min(1, Number(match.match_score) / 100),
    });
  }

  assembled.sort((a, b) => b.match_score - a.match_score || b.keyword_score - a.keyword_score);
  return assembled;
}
