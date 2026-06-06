import { describe, it, expect } from 'vitest';
import { planSources } from '../../src/sources/plan.js';
import { ENRICHED_DOMAINS } from '../../src/domains/enrich.js';

const ai = ENRICHED_DOMAINS.find((d) => d.slug === 'ai_ml_genai')!;
const devops = ENRICHED_DOMAINS.find((d) => d.slug === 'devops_platform_sre')!;

describe('planSources', () => {
  it('always plans keyless boards and RemoteOK with no keys', () => {
    const reqs = planSources([ai], 'IE');
    const kinds = new Set(reqs.map((r) => r.kind));
    expect(kinds.has('greenhouse')).toBe(true);
    expect(kinds.has('lever')).toBe(true);
    expect(kinds.has('ashby')).toBe(true);
    expect(kinds.has('remoteok')).toBe(true);
    // no keys -> no aggregator/AI sources
    expect(kinds.has('adzuna')).toBe(false);
    expect(kinds.has('serpapi')).toBe(false);
    expect(kinds.has('sgai')).toBe(false);
  });

  it('adds aggregator sources only when their keys are present', () => {
    const reqs = planSources([ai], 'IE', {
      keys: { adzunaId: 'id', adzunaKey: 'key', joobleKey: 'jk', serpKey: 'sk', sgaiKey: 'gk' },
    });
    const kinds = new Set(reqs.map((r) => r.kind));
    expect(kinds.has('adzuna')).toBe(true);
    expect(kinds.has('jooble')).toBe(true);
    expect(kinds.has('serpapi')).toBe(true);
    expect(kinds.has('sgai')).toBe(true);
  });

  it('tags ATS requests with their company slug', () => {
    const gh = planSources([ai], 'IE').find((r) => r.kind === 'greenhouse');
    expect(gh?.company).toBeTruthy();
    expect(gh?.name).toBe(`gh:${gh?.company}`);
    expect(gh?.options.url).toContain(gh!.company!);
  });

  it('caps boards per provider when configured', () => {
    const capped = planSources([ai], 'IE', { maxCompanyBoardsPerSource: 5 });
    expect(capped.filter((r) => r.kind === 'greenhouse')).toHaveLength(5);
  });

  it('uses 2 API pages for a single domain and 1 for many', () => {
    const single = planSources([ai], 'IE', { keys: { adzunaId: 'i', adzunaKey: 'k' } });
    const pages = new Set(
      single.filter((r) => r.kind === 'adzuna').map((r) => r.name.split(':p')[1]),
    );
    expect(pages).toEqual(new Set(['1', '2']));

    const multi = planSources([ai, devops], 'IE', { keys: { adzunaId: 'i', adzunaKey: 'k' } });
    const multiPages = new Set(
      multi.filter((r) => r.kind === 'adzuna').map((r) => r.name.split(':p')[1]),
    );
    expect(multiPages).toEqual(new Set(['1']));
  });

  it('maps the country into Adzuna locale and location', () => {
    const [adzuna] = planSources([ai], 'US', { keys: { adzunaId: 'i', adzunaKey: 'k' } }).filter(
      (r) => r.kind === 'adzuna',
    );
    expect(adzuna!.options.url).toContain('/us/');
    expect(adzuna!.options.qs?.where).toBe('United States');
  });

  it('defaults unknown countries to gb/Ireland', () => {
    const [adzuna] = planSources([ai], 'ZZ', { keys: { adzunaId: 'i', adzunaKey: 'k' } }).filter(
      (r) => r.kind === 'adzuna',
    );
    expect(adzuna!.options.url).toContain('/gb/');
    expect(adzuna!.options.qs?.where).toBe('Ireland');
  });
});
