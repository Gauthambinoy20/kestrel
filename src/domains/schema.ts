import { z } from 'zod';
import type { Domain, EnrichedDomain } from './types.js';
import { enrichDomain, ENRICHED_DOMAINS } from './enrich.js';

/**
 * Validation schema for an authored {@link Domain}. Lets users extend the
 * taxonomy from config (or a future file/UI) with confidence that a malformed
 * domain is rejected with a clear error rather than silently misbehaving.
 */
export const DomainSchema = z.object({
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9_]+$/, 'slug must be lower-case letters, digits or underscores'),
  label: z.string().trim().min(1),
  inputAliases: z.array(z.string().trim().min(1)).min(1),
  searchQueries: z.array(z.string().trim().min(1)).min(1),
  coreRoles: z.array(z.string().trim().min(1)).min(1),
  terms: z.array(z.string().trim().min(1)).min(1),
});

/** Validate and parse a single authored domain (throws on invalid input). */
export function parseDomain(input: unknown): Domain {
  return DomainSchema.parse(input);
}

/**
 * Build an enriched domain set from the built-in taxonomy plus any validated
 * custom domains. A custom domain whose slug matches a built-in one overrides
 * it; the rest are appended. Throws if any custom domain is malformed.
 */
export function loadDomains(custom: readonly unknown[] = []): EnrichedDomain[] {
  const parsed = custom.map((c) => parseDomain(c));
  const bySlug = new Map<string, EnrichedDomain>(ENRICHED_DOMAINS.map((d) => [d.slug, d]));
  for (const domain of parsed) {
    bySlug.set(domain.slug, enrichDomain(domain));
  }
  return [...bySlug.values()];
}
