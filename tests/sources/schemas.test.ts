import { describe, it, expect } from 'vitest';
import { RawJobSchema } from '../../src/sources/schemas.js';

const valid = {
  source: 'gh:stripe',
  title: 'Backend Engineer',
  url: 'https://boards.greenhouse.io/stripe/jobs/1',
};

describe('RawJobSchema', () => {
  it('accepts a minimal valid job', () => {
    expect(RawJobSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts a fully populated job and preserves raw', () => {
    const parsed = RawJobSchema.parse({
      ...valid,
      company: 'Stripe',
      location: 'Dublin',
      jd_text: 'Build payments infra',
      posted_at: '2026-06-01',
      raw: { id: 1 },
    });
    expect(parsed.company).toBe('Stripe');
    expect(parsed.raw).toEqual({ id: 1 });
  });

  it.each([
    ['missing title', { source: 's', url: 'u' }],
    ['empty title', { source: 's', title: '   ', url: 'u' }],
    ['missing url', { source: 's', title: 't' }],
    ['empty url', { source: 's', title: 't', url: '' }],
    ['missing source', { title: 't', url: 'u' }],
    ['title wrong type', { source: 's', title: 123, url: 'u' }],
    ['url wrong type', { source: 's', title: 't', url: { a: 1 } }],
  ])('rejects %s', (_label, input) => {
    expect(RawJobSchema.safeParse(input).success).toBe(false);
  });

  it('allows null company and location', () => {
    const parsed = RawJobSchema.parse({ ...valid, company: null, location: null });
    expect(parsed.company).toBeNull();
  });

  it('surfaces the offending field path on failure', () => {
    const result = RawJobSchema.safeParse({ source: 's', title: '', url: 'u' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['title']);
    }
  });
});
