import { normalizeText, stripTitleNoise } from '../text/normalize.js';
import type { Domain, EnrichedDomain } from './types.js';
import { DOMAIN_TAXONOMY } from './taxonomy.js';

/**
 * Entry-level / variant prefixes applied to every core role. The empty string
 * keeps the unprefixed role; the rest broaden coverage to junior and
 * alternative-arrangement postings.
 */
export const ENTRY_TITLE_PREFIXES = [
  '',
  'Junior ',
  'Associate ',
  'Graduate ',
  'Entry Level ',
  'Early Career ',
  'New Grad ',
  'Trainee ',
  'Apprentice ',
  'Remote ',
  'Contract ',
  'Freelance ',
] as const;

/** Seniority/level suffixes applied to every core role. */
export const ENTRY_TITLE_SUFFIXES = ['', ' I', ' II', ' Associate', ' Specialist'] as const;

/**
 * Expand a {@link Domain} into an {@link EnrichedDomain}: generate the full
 * alias set (core roles × prefix/suffix variants, de-duplicated), derive the
 * normalised needle list used for substring matching, and pre-normalise the
 * input and term lookup tables so the matching hot-path does no string work.
 */
export function enrichDomain(domain: Domain): EnrichedDomain {
  const rawAliases = new Set<string>();
  for (const role of domain.coreRoles) {
    rawAliases.add(role);
    for (const prefix of ENTRY_TITLE_PREFIXES) {
      for (const suffix of ENTRY_TITLE_SUFFIXES) {
        rawAliases.add(`${prefix}${role}${suffix}`.trim());
      }
    }
  }
  const aliases = [...rawAliases].filter(Boolean);
  const aliasNeedles = [...new Set(aliases.map(stripTitleNoise).filter((v) => v.length >= 4))];
  return {
    ...domain,
    aliases,
    aliasNeedles,
    aliasCount: aliases.length,
    normalizedInputs: [domain.slug, domain.label, ...domain.inputAliases].map(normalizeText),
    normalizedTerms: domain.terms.map(normalizeText),
  };
}

/** The full taxonomy, enriched once at module load for reuse across runs. */
export const ENRICHED_DOMAINS: readonly EnrichedDomain[] = DOMAIN_TAXONOMY.map(enrichDomain);
