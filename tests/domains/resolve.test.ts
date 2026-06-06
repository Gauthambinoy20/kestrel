import { describe, it, expect } from 'vitest';
import { resolveSelectedDomains } from '../../src/domains/resolve.js';
import { ENRICHED_DOMAINS } from '../../src/domains/enrich.js';

describe('resolveSelectedDomains', () => {
  it.each(['all', 'All Domains', 'everything', 'ANY', 'all it'])(
    'selects every domain for "%s"',
    (token) => {
      expect(resolveSelectedDomains(token)).toHaveLength(ENRICHED_DOMAINS.length);
    },
  );

  it('matches an exact label', () => {
    const r = resolveSelectedDomains('Software Engineering');
    expect(r).toHaveLength(1);
    expect(r[0]?.slug).toBe('software_engineering');
  });

  it('matches an exact input alias', () => {
    const r = resolveSelectedDomains('devops');
    expect(r[0]?.slug).toBe('devops_platform_sre');
  });

  it('matches a slug even with underscores', () => {
    const r = resolveSelectedDomains('devops_platform_sre');
    expect(r[0]?.slug).toBe('devops_platform_sre');
  });

  it.each([
    [null, 'ai_ml_genai'],
    [undefined, 'ai_ml_genai'],
    ['', 'ai_ml_genai'],
  ])('falls back to the default AI domain for %p', (input, expectedSlug) => {
    const r = resolveSelectedDomains(input);
    expect(r).toHaveLength(1);
    expect(r[0]?.slug).toBe(expectedSlug);
  });

  it('fuzzy-matches when the request contains an alias', () => {
    const r = resolveSelectedDomains('devops engineer role');
    expect(r[0]?.slug).toBe('devops_platform_sre');
  });

  it('synthesises a custom domain for an unknown request', () => {
    const r = resolveSelectedDomains('underwater basket weaving');
    expect(r).toHaveLength(1);
    const d = r[0]!;
    expect(d.slug).toBe('underwater_basket_weaving');
    expect(d.label).toBe('underwater basket weaving');
    expect(d.coreRoles).toContain('underwater basket weaving');
    // terms keep only tokens longer than 2 chars.
    expect(d.terms).toEqual(['underwater', 'basket', 'weaving']);
    expect(d.aliasCount).toBeGreaterThan(0);
  });

  it('custom domain slug strips leading/trailing separators', () => {
    const r = resolveSelectedDomains('!!!weird---input!!!');
    expect(r[0]?.slug).toBe('weird_input');
  });

  it('returns enriched domains (with alias data) in every branch', () => {
    for (const input of ['all', 'devops', 'totally unknown domain xyz']) {
      const r = resolveSelectedDomains(input);
      expect(r.every((d) => typeof d.aliasCount === 'number' && d.aliasNeedles)).toBe(true);
    }
  });
});
