import { describe, it, expect } from 'vitest';
import { applyFilters, EMPTY_FILTERS, type FilterableJob } from './filters.js';

const job = (over: Partial<FilterableJob> = {}): FilterableJob => ({
  title: 'Backend Engineer',
  company: 'Stripe',
  link_ok: true,
  annotations: { workMode: 'remote', visa: { sponsorshipOffered: false } },
  ...over,
});

describe('applyFilters', () => {
  const jobs = [
    job(),
    job({ title: 'Data Scientist', company: 'Acme', annotations: { workMode: 'hybrid', visa: { sponsorshipOffered: true } } }),
    job({ title: 'QA Engineer', link_ok: false, annotations: { workMode: 'onsite', visa: { sponsorshipOffered: false } } }),
  ];

  it('returns everything with empty filters', () => {
    expect(applyFilters(jobs, EMPTY_FILTERS)).toHaveLength(3);
  });

  it('filters by query across title and company', () => {
    expect(applyFilters(jobs, { ...EMPTY_FILTERS, query: 'acme' })).toHaveLength(1);
    expect(applyFilters(jobs, { ...EMPTY_FILTERS, query: 'engineer' })).toHaveLength(2);
  });

  it('filters by work mode', () => {
    expect(applyFilters(jobs, { ...EMPTY_FILTERS, workMode: 'hybrid' })).toHaveLength(1);
  });

  it('filters to sponsorship-only', () => {
    const r = applyFilters(jobs, { ...EMPTY_FILTERS, sponsorshipOnly: true });
    expect(r).toHaveLength(1);
    expect(r[0]?.company).toBe('Acme');
  });

  it('filters to live links only', () => {
    expect(applyFilters(jobs, { ...EMPTY_FILTERS, liveOnly: true })).toHaveLength(2);
  });

  it('combines filters', () => {
    expect(
      applyFilters(jobs, { query: 'engineer', workMode: 'remote', sponsorshipOnly: false, liveOnly: true }),
    ).toHaveLength(1);
  });
});
