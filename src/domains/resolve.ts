import { normalizeText } from '../text/normalize.js';
import type { EnrichedDomain } from './types.js';
import { enrichDomain, ENRICHED_DOMAINS } from './enrich.js';

/** Tokens that select every domain at once. */
const ALL_TOKENS = ['all', 'all domains', 'all it', 'everything', 'any'];

/** Default domain when the caller provides nothing. */
const DEFAULT_DOMAIN = 'AI, Machine Learning and GenAI';

/**
 * Resolve a free-text domain request to one or more enriched domains:
 *
 * 1. `all` / `everything` / … → the entire taxonomy.
 * 2. Exact match against a domain's normalised slug, label or input aliases.
 * 3. Fuzzy match where the request contains, or is contained by, an input alias.
 * 4. Otherwise synthesise a one-off custom domain from the raw request so the
 *    pipeline still runs for unanticipated inputs.
 */
export function resolveSelectedDomains(rawDomain: string | null | undefined): EnrichedDomain[] {
  const requested = rawDomain || DEFAULT_DOMAIN;
  const raw = normalizeText(requested);

  if (ALL_TOKENS.includes(raw)) {
    return [...ENRICHED_DOMAINS];
  }

  const exact = ENRICHED_DOMAINS.find((d) => d.normalizedInputs.includes(raw));
  if (exact) return [exact];

  const fuzzy = ENRICHED_DOMAINS.find((d) =>
    d.normalizedInputs.some((alias) => raw.includes(alias) || alias.includes(raw)),
  );
  if (fuzzy) return [fuzzy];

  return [
    enrichDomain({
      slug: raw.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'custom',
      label: requested,
      inputAliases: [requested],
      searchQueries: [requested],
      coreRoles: [requested],
      terms: normalizeText(requested)
        .split(/\s+/)
        .filter((t) => t.length > 2),
    }),
  ];
}
