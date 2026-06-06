import { describe, it, expect } from 'vitest';
import { DomainSchema, parseDomain, loadDomains } from '../../src/domains/schema.js';
import { ENRICHED_DOMAINS } from '../../src/domains/enrich.js';

const valid = {
  slug: 'robotics',
  label: 'Robotics Engineering',
  inputAliases: ['robotics', 'robot'],
  searchQueries: ['Robotics Engineer'],
  coreRoles: ['Robotics Engineer', 'Controls Engineer'],
  terms: ['robotics', 'ros', 'controls'],
};

describe('DomainSchema', () => {
  it('accepts a well-formed domain', () => {
    expect(DomainSchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    ['bad slug', { ...valid, slug: 'Robotics Engineering' }],
    ['empty label', { ...valid, label: '' }],
    ['no input aliases', { ...valid, inputAliases: [] }],
    ['no core roles', { ...valid, coreRoles: [] }],
    ['no terms', { ...valid, terms: [] }],
    ['missing field', { slug: 'x', label: 'X' }],
  ])('rejects %s', (_label, input) => {
    expect(DomainSchema.safeParse(input).success).toBe(false);
  });
});

describe('parseDomain', () => {
  it('returns the parsed domain', () => {
    expect(parseDomain(valid).slug).toBe('robotics');
  });
  it('throws on invalid input', () => {
    expect(() => parseDomain({ slug: 'x' })).toThrow();
  });
});

describe('loadDomains', () => {
  it('returns the built-in taxonomy when given no custom domains', () => {
    expect(loadDomains()).toHaveLength(ENRICHED_DOMAINS.length);
  });

  it('appends a new custom domain (enriched)', () => {
    const loaded = loadDomains([valid]);
    expect(loaded).toHaveLength(ENRICHED_DOMAINS.length + 1);
    const robotics = loaded.find((d) => d.slug === 'robotics');
    expect(robotics?.aliasCount).toBeGreaterThan(0);
    expect(robotics?.aliasNeedles.length).toBeGreaterThan(0);
  });

  it('overrides a built-in domain when slugs collide', () => {
    const override = { ...valid, slug: 'ai_ml_genai', label: 'Custom AI' };
    const loaded = loadDomains([override]);
    expect(loaded).toHaveLength(ENRICHED_DOMAINS.length);
    expect(loaded.find((d) => d.slug === 'ai_ml_genai')?.label).toBe('Custom AI');
  });

  it('throws if any custom domain is malformed', () => {
    expect(() => loadDomains([{ slug: 'bad slug' }])).toThrow();
  });
});
