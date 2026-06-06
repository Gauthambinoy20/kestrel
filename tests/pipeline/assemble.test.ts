import { describe, it, expect } from 'vitest';
import { assembleJobs, type AssembleContext } from '../../src/pipeline/assemble.js';
import { ENRICHED_DOMAINS } from '../../src/domains/enrich.js';
import type { RawJob } from '../../src/sources/types.js';

const ai = ENRICHED_DOMAINS.find((d) => d.slug === 'ai_ml_genai')!;

const ctx = (overrides: Partial<AssembleContext> = {}): AssembleContext => ({
  selectedDomains: [ai],
  country: 'IE',
  defaultLocation: 'Ireland',
  telegramChatId: '123',
  blocklist: [],
  now: '2026-06-06T00:00:00.000Z',
  ...overrides,
});

const job = (over: Partial<RawJob> = {}): RawJob => ({
  source: 'gh:acme',
  title: 'Machine Learning Engineer',
  company: 'Acme',
  location: 'Dublin',
  url: 'https://acme.com/jobs/1',
  jd_text: 'pytorch',
  posted_at: '2026-06-01',
  ...over,
});

describe('assembleJobs', () => {
  it('assembles a matched job with the canonical fields', () => {
    const [a] = assembleJobs([job()], ctx());
    expect(a).toMatchObject({
      domain_slug: 'ai_ml_genai',
      country: 'IE',
      telegram_chat_id: '123',
      company: 'Acme',
      location: 'Dublin',
      url: 'https://acme.com/jobs/1',
      filter_status: 'passed',
      title_normalized: 'machine learning engineer',
    });
    expect(a?.hash).toMatch(/^[0-9a-f]{32}$/);
    expect(a?.keyword_score).toBeCloseTo(a!.match_score / 100);
  });

  it('skips senior titles', () => {
    expect(assembleJobs([job({ title: 'Senior Machine Learning Engineer' })], ctx())).toHaveLength(
      0,
    );
  });

  it('skips jobs that match no domain', () => {
    expect(assembleJobs([job({ title: 'Pastry Chef', jd_text: 'baking' })], ctx())).toHaveLength(0);
  });

  it('de-duplicates by URL before assembling', () => {
    const out = assembleJobs([job(), job({ company: 'Dupe' })], ctx());
    expect(out).toHaveLength(1);
    expect(out[0]?.company).toBe('Acme');
  });

  it('sorts by match score descending', () => {
    const strong = job({ url: 'https://a/strong', jd_text: 'pytorch tensorflow llm rag nlp' });
    const weak = job({ title: 'Data Scientist', url: 'https://a/weak', jd_text: '' });
    const out = assembleJobs([weak, strong], ctx());
    expect(out[0]?.url).toBe('https://a/strong');
    expect(out[0]!.match_score).toBeGreaterThanOrEqual(out[1]!.match_score);
  });

  it('falls back to Unknown company and the default location', () => {
    const [a] = assembleJobs([job({ company: null, location: null })], ctx());
    expect(a?.company).toBe('Unknown');
    expect(a?.location).toBe('Ireland');
  });

  it('detects remote roles from title or location', () => {
    const fromLocation = assembleJobs([job({ location: 'Remote (EU)' })], ctx());
    expect(fromLocation[0]?.remote_type).toBe('remote');
    const fromTitle = assembleJobs(
      [job({ title: 'Remote Machine Learning Engineer', location: 'Dublin' })],
      ctx(),
    );
    expect(fromTitle[0]?.remote_type).toBe('remote');
    const onsite = assembleJobs([job()], ctx());
    expect(onsite[0]?.remote_type).toBeNull();
  });

  it('truncates the description to 4000 chars', () => {
    const [a] = assembleJobs([job({ jd_text: 'x'.repeat(5000) })], ctx());
    expect(a?.jd_text.length).toBe(4000);
  });

  it('uses the injected now as the posted-at fallback', () => {
    const [a] = assembleJobs([job({ posted_at: null })], ctx());
    expect(a?.posted_at).toBe('2026-06-06T00:00:00.000Z');
  });

  it('defaults telegram_chat_id to empty string when absent', () => {
    const c = ctx();
    const without: AssembleContext = {
      selectedDomains: c.selectedDomains,
      country: c.country,
      defaultLocation: c.defaultLocation,
      now: c.now,
    };
    const [a] = assembleJobs([job()], without);
    expect(a?.telegram_chat_id).toBe('');
  });

  it('returns an empty array for no jobs', () => {
    expect(assembleJobs([], ctx())).toEqual([]);
  });
});
