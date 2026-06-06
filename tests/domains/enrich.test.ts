import { describe, it, expect } from 'vitest';
import {
  enrichDomain,
  ENRICHED_DOMAINS,
  ENTRY_TITLE_PREFIXES,
  ENTRY_TITLE_SUFFIXES,
} from '../../src/domains/enrich.js';
import { DOMAIN_TAXONOMY } from '../../src/domains/taxonomy.js';
import type { Domain } from '../../src/domains/types.js';

const sample: Domain = {
  slug: 'sample',
  label: 'Sample Domain',
  inputAliases: ['sample', 'samp'],
  searchQueries: ['Sample Engineer'],
  coreRoles: ['Backend Engineer', 'Go Developer'],
  terms: ['backend', 'go'],
};

describe('enrichDomain', () => {
  it('keeps the original domain fields', () => {
    const e = enrichDomain(sample);
    expect(e.slug).toBe('sample');
    expect(e.coreRoles).toEqual(sample.coreRoles);
  });

  it('includes every core role verbatim in the aliases', () => {
    const e = enrichDomain(sample);
    for (const role of sample.coreRoles) {
      expect(e.aliases).toContain(role);
    }
  });

  it('generates prefixed and suffixed variants', () => {
    const e = enrichDomain(sample);
    expect(e.aliases).toContain('Junior Backend Engineer');
    expect(e.aliases).toContain('Graduate Go Developer Specialist');
  });

  it('de-duplicates aliases and trims them', () => {
    const e = enrichDomain(sample);
    expect(new Set(e.aliases).size).toBe(e.aliases.length);
    expect(e.aliases.every((a) => a === a.trim() && a.length > 0)).toBe(true);
    expect(e.aliasCount).toBe(e.aliases.length);
  });

  it('produces normalised needles of length >= 4, de-duplicated', () => {
    const e = enrichDomain(sample);
    expect(e.aliasNeedles.every((n) => n.length >= 4)).toBe(true);
    expect(new Set(e.aliasNeedles).size).toBe(e.aliasNeedles.length);
    expect(e.aliasNeedles).toContain('backend engineer');
  });

  it('normalises inputs (slug + label + input aliases) and terms', () => {
    const e = enrichDomain(sample);
    expect(e.normalizedInputs).toContain('sample');
    expect(e.normalizedInputs).toContain('sample domain');
    expect(e.normalizedTerms).toEqual(['backend', 'go']);
  });

  it('grows the alias count well beyond the core role count', () => {
    const e = enrichDomain(sample);
    // 2 roles × (12 prefixes × 5 suffixes) minus dedup, plus the bare roles.
    expect(e.aliasCount).toBeGreaterThan(sample.coreRoles.length);
  });
});

describe('expansion tables', () => {
  it('includes the identity (empty) prefix and suffix', () => {
    expect(ENTRY_TITLE_PREFIXES).toContain('');
    expect(ENTRY_TITLE_SUFFIXES).toContain('');
  });
});

describe('ENRICHED_DOMAINS', () => {
  it('enriches all 20 domains', () => {
    expect(ENRICHED_DOMAINS).toHaveLength(DOMAIN_TAXONOMY.length);
  });

  it.each(ENRICHED_DOMAINS.map((d) => [d.slug, d] as const))(
    'domain %s generates at least 835 aliases',
    (_slug, domain) => {
      expect(domain.aliasCount).toBeGreaterThanOrEqual(835);
    },
  );

  it.each(ENRICHED_DOMAINS.map((d) => [d.slug, d] as const))(
    'domain %s has non-empty normalised needles',
    (_slug, domain) => {
      expect(domain.aliasNeedles.length).toBeGreaterThan(0);
      expect(domain.aliasNeedles.every((n) => n.length >= 4)).toBe(true);
    },
  );
});
