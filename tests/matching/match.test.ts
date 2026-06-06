import { describe, it, expect } from 'vitest';
import { matchJobToDomains } from '../../src/matching/match.js';
import { ENRICHED_DOMAINS } from '../../src/domains/enrich.js';
import type { EnrichedDomain } from '../../src/domains/types.js';

const ai = ENRICHED_DOMAINS.find((d) => d.slug === 'ai_ml_genai')!;
const devops = ENRICHED_DOMAINS.find((d) => d.slug === 'devops_platform_sre')!;

describe('matchJobToDomains — core-role hits', () => {
  it('matches a core role in the title with a strong score', () => {
    const m = matchJobToDomains({ title: 'Machine Learning Engineer' }, [ai]);
    expect(m).not.toBeNull();
    expect(m!.domain_slug).toBe('ai_ml_genai');
    expect(m!.matched_role).toBe('Machine Learning Engineer');
    expect(m!.match_score).toBeGreaterThanOrEqual(78);
  });

  it('caps the score at 100 when role + keywords overflow', () => {
    const m = matchJobToDomains(
      {
        title: 'AI Engineer',
        jd_text: 'pytorch tensorflow llm rag nlp computer vision deep learning embeddings',
      },
      [ai],
    );
    expect(m!.match_score).toBe(100);
    expect(m!.keyword_hits.length).toBeGreaterThan(0);
  });
});

describe('matchJobToDomains — keyword-only path', () => {
  it('matches on >= 3 keyword hits even without a title role', () => {
    const m = matchJobToDomains(
      { title: 'Builder', jd_text: 'kubernetes terraform ci/cd observability prometheus' },
      [devops],
    );
    expect(m).not.toBeNull();
    expect(m!.domain_slug).toBe('devops_platform_sre');
    // no role hit -> matched_alias is the joined keyword hits
    expect(m!.matched_alias.length).toBeGreaterThan(0);
    expect(m!.match_score).toBeLessThan(78);
  });

  it('skips a domain with no role hit and fewer than 3 keyword hits', () => {
    const m = matchJobToDomains({ title: 'Builder', jd_text: 'kubernetes only' }, [devops]);
    expect(m).toBeNull();
  });
});

describe('matchJobToDomains — alias-needle path', () => {
  it('matches via an alias needle when no core role hits', () => {
    // Hand-built domain: the core role base ("zeta") is absent from the title,
    // but an alias needle ("gamma role") is present -> the 70-point path.
    const synthetic: EnrichedDomain = {
      slug: 'synthetic',
      label: 'Synthetic',
      inputAliases: ['synthetic'],
      searchQueries: ['Zeta'],
      coreRoles: ['Zeta'],
      terms: [],
      aliases: ['Zeta', 'gamma role'],
      aliasNeedles: ['gamma role'],
      aliasCount: 2,
      normalizedInputs: ['synthetic'],
      normalizedTerms: [],
    };
    const m = matchJobToDomains({ title: 'Gamma Role' }, [synthetic]);
    expect(m).not.toBeNull();
    expect(m!.matched_alias).toBe('gamma role');
    expect(m!.match_score).toBe(70);
  });
});

describe('matchJobToDomains — selection across domains', () => {
  it('returns the highest-scoring domain', () => {
    const m = matchJobToDomains(
      { title: 'Machine Learning Engineer', jd_text: 'kubernetes terraform' },
      [devops, ai],
    );
    expect(m!.domain_slug).toBe('ai_ml_genai');
  });

  it('returns null when nothing matches', () => {
    const m = matchJobToDomains({ title: 'Pastry Chef', jd_text: 'baking bread' }, [ai, devops]);
    expect(m).toBeNull();
  });

  it('handles empty input safely', () => {
    expect(matchJobToDomains({}, ENRICHED_DOMAINS)).toBeNull();
  });

  it('reports the domain alias_count on a match', () => {
    const m = matchJobToDomains({ title: 'Data Scientist' }, [ai]);
    expect(m!.alias_count).toBe(ai.aliasCount);
  });

  it('limits keyword_hits to at most 12 entries', () => {
    const m = matchJobToDomains(
      {
        title: 'AI Engineer',
        jd_text:
          'artificial intelligence machine learning generative ai genai llm rag nlp computer vision deep learning pytorch tensorflow mlops embeddings',
      },
      [ai],
    );
    expect(m!.keyword_hits.split(', ').length).toBeLessThanOrEqual(12);
  });

  it('works end-to-end against the full enriched taxonomy', () => {
    const m = matchJobToDomains({ title: 'Frontend Engineer', jd_text: 'react typescript css' }, [
      ...ENRICHED_DOMAINS,
    ]);
    expect(m!.domain_slug).toBe('frontend_web');
  });
});
