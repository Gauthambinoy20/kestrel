import { normalizeText } from '../text/normalize.js';

/**
 * De-duplicate jobs by a normalised URL key (lower-cased, punctuation and
 * whitespace removed) so the same posting surfaced by two sources — or with
 * trivial URL differences — is kept only once. The first occurrence wins;
 * entries with an empty/unusable URL key are dropped.
 */
export function dedupeByUrl<T extends { url: string }>(jobs: readonly T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const job of jobs) {
    const key = normalizeText(job.url).replace(/\s/g, '');
    if (key.length === 0 || seen.has(key)) continue;
    seen.add(key);
    out.push(job);
  }
  return out;
}
