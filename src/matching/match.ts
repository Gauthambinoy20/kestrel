import { normalizeText, stripTitleNoise, containsPhrase } from '../text/normalize.js';
import type { EnrichedDomain } from '../domains/types.js';

/** The job fields the matcher reads. */
export interface MatchInput {
  readonly title?: string | null;
  readonly jd_text?: string | null;
  readonly company?: string | null;
  readonly source?: string | null;
}

/** The winning domain match for a job, with a 0–100 score and explanation. */
export interface DomainMatch {
  readonly domain_slug: string;
  readonly domain_label: string;
  readonly matched_role: string;
  readonly matched_alias: string;
  readonly match_score: number;
  readonly keyword_hits: string;
  readonly alias_count: number;
}

const CORE_ROLE_SCORE = 78;
const ALIAS_NEEDLE_SCORE = 70;
const KEYWORD_UNIT = 5;
const KEYWORD_CAP = 25;

/**
 * Match a job to the best-fitting selected domain.
 *
 * Per domain, scoring is the better of: a core-role title hit (strong), or an
 * alias-needle hit (good); plus a capped keyword bonus from the job's combined
 * title/description/company/source text. A domain with neither a title hit nor
 * at least three keyword hits is skipped. Returns the highest-scoring domain,
 * or `null` when nothing matches.
 */
export function matchJobToDomains(
  job: MatchInput,
  selectedDomains: readonly EnrichedDomain[],
): DomainMatch | null {
  const titleNorm = normalizeText(job.title);
  const titleBase = stripTitleNoise(job.title);
  const hay = `${titleNorm} ${normalizeText(job.jd_text)} ${normalizeText(job.company)} ${normalizeText(job.source)}`;

  let best: DomainMatch | null = null;
  for (const domain of selectedDomains) {
    let bestAlias = '';
    let bestRole = '';
    let aliasScore = 0;

    for (const role of domain.coreRoles) {
      const r = stripTitleNoise(role);
      if (r && titleBase.includes(r)) {
        bestAlias = role;
        bestRole = role;
        aliasScore = Math.max(aliasScore, CORE_ROLE_SCORE);
        break;
      }
    }

    if (!bestAlias) {
      for (const alias of domain.aliasNeedles) {
        if (alias.length >= 4 && (titleBase.includes(alias) || titleNorm.includes(alias))) {
          bestAlias = alias;
          bestRole = domain.coreRoles.find((role) => stripTitleNoise(role) === alias) ?? alias;
          aliasScore = Math.max(aliasScore, ALIAS_NEEDLE_SCORE);
          break;
        }
      }
    }

    const keywordHits = domain.normalizedTerms.filter(
      (term) => term.length >= 3 && containsPhrase(hay, term),
    );
    const keywordScore = Math.min(KEYWORD_CAP, keywordHits.length * KEYWORD_UNIT);
    if (!bestAlias && keywordHits.length < 3) continue;

    const score = aliasScore + keywordScore;
    if (!best || score > best.match_score) {
      best = {
        domain_slug: domain.slug,
        domain_label: domain.label,
        matched_role: bestRole || domain.label,
        matched_alias: bestAlias || keywordHits.slice(0, 3).join(', '),
        match_score: Math.min(100, score),
        keyword_hits: keywordHits.slice(0, 12).join(', '),
        alias_count: domain.aliasCount,
      };
    }
  }
  return best;
}
