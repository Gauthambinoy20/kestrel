import { describe, it, expect } from 'vitest';
import { DOMAIN_TAXONOMY } from '../../src/domains/taxonomy.js';

describe('DOMAIN_TAXONOMY', () => {
  it('defines exactly 20 locked domains', () => {
    expect(DOMAIN_TAXONOMY).toHaveLength(20);
  });

  it('has unique slugs', () => {
    const slugs = DOMAIN_TAXONOMY.map((d) => d.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('has unique labels', () => {
    const labels = DOMAIN_TAXONOMY.map((d) => d.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it.each(DOMAIN_TAXONOMY.map((d) => [d.slug, d] as const))(
    'domain %s is fully populated',
    (_slug, domain) => {
      expect(domain.slug).toMatch(/^[a-z0-9_]+$/);
      expect(domain.label.length).toBeGreaterThan(0);
      expect(domain.inputAliases.length).toBeGreaterThan(0);
      expect(domain.searchQueries.length).toBeGreaterThan(0);
      expect(domain.coreRoles.length).toBeGreaterThan(0);
      expect(domain.terms.length).toBeGreaterThan(0);
    },
  );

  it.each(DOMAIN_TAXONOMY.map((d) => [d.slug, d] as const))(
    'domain %s has no empty strings in its arrays',
    (_slug, domain) => {
      const all = [
        ...domain.inputAliases,
        ...domain.searchQueries,
        ...domain.coreRoles,
        ...domain.terms,
      ];
      expect(all.every((s) => s.trim().length > 0)).toBe(true);
    },
  );

  it('includes the flagship AI/ML domain with expected shape', () => {
    const ai = DOMAIN_TAXONOMY.find((d) => d.slug === 'ai_ml_genai');
    expect(ai?.label).toBe('AI, Machine Learning and GenAI');
    expect(ai?.coreRoles).toContain('Machine Learning Engineer');
  });
});
