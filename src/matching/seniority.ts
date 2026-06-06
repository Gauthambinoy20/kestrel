import { normalizeText, containsPhrase } from '../text/normalize.js';

/**
 * Hard seniority/management title patterns. Each is anchored on word boundaries
 * so it matches whole words only — `\bhead\b` blocks "Head of Data" but not
 * "Headless CMS Developer", and `\blead\b` blocks "Lead Engineer" but not
 * "Leadership Programme".
 */
const HARD_BLOCK_PATTERNS: readonly RegExp[] = [
  /\bsenior\b/,
  /\bsr\b/,
  /\bstaff\b/,
  /\bprincipal\b/,
  /\blead\b/,
  /\bdirector\b/,
  /\bhead\b/,
  /\bvp\b/,
  /\bchief\b/,
  /\bcto\b/,
  /\bciso\b/,
  /\bengineering manager\b/,
  /\bsoftware development manager\b/,
  /\bteam manager\b/,
];

/**
 * Decide whether a job title should be rejected as too senior. Applies the hard
 * seniority/management blocklist, then any caller-supplied extra terms — but the
 * bare word "manager" is deliberately ignored there, since plenty of valid
 * non-senior roles ("Product Manager") contain it; only specific manager titles
 * are hard-blocked above.
 *
 * @param domainSlug accepted for call-site symmetry; not used in the decision.
 */
export function jobSeniorityBlocked(
  title: string | null | undefined,
  domainSlug?: string,
  extraBlocklist: readonly string[] = [],
): boolean {
  void domainSlug;
  const t = normalizeText(title);
  if (HARD_BLOCK_PATTERNS.some((re) => re.test(t))) return true;

  const list: readonly string[] = Array.isArray(extraBlocklist) ? extraBlocklist : [];
  const cleaned = list
    .map((w) => normalizeText(w))
    .filter((v) => v.length > 0 && v !== 'manager');
  return cleaned.some((word) => containsPhrase(t, word));
}
