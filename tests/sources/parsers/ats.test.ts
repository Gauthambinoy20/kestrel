import { describe, it, expect } from 'vitest';
import { parseGreenhouse, parseLever, parseAshby } from '../../../src/sources/parsers/ats.js';
import { validateRawJobs } from '../../../src/sources/validate.js';

describe('parseGreenhouse', () => {
  const data = {
    jobs: [
      {
        title: 'Backend Engineer',
        location: { name: 'Dublin' },
        absolute_url: 'https://boards.greenhouse.io/stripe/jobs/1',
        content: '<p>Build <b>payments</b></p>',
        updated_at: '2026-06-01T00:00:00Z',
      },
    ],
  };

  it('maps a greenhouse job', () => {
    const [job] = parseGreenhouse(data, 'stripe');
    expect(job).toMatchObject({
      source: 'gh:stripe',
      title: 'Backend Engineer',
      company: 'stripe',
      location: 'Dublin',
      url: 'https://boards.greenhouse.io/stripe/jobs/1',
      posted_at: '2026-06-01T00:00:00Z',
    });
    expect(job?.jd_text).not.toContain('<');
  });

  it('returns [] for a malformed envelope', () => {
    expect(parseGreenhouse(null, 'stripe')).toEqual([]);
    expect(parseGreenhouse({ jobs: 'nope' }, 'stripe')).toEqual([]);
  });

  it('produces validatable jobs', () => {
    const { valid } = validateRawJobs(parseGreenhouse(data, 'stripe'));
    expect(valid).toHaveLength(1);
  });
});

describe('parseLever', () => {
  const data = [
    {
      text: 'Frontend Engineer',
      categories: { location: 'Remote' },
      hostedUrl: 'https://jobs.lever.co/netflix/1',
      descriptionPlain: 'Build UI',
      createdAt: 0,
    },
  ];

  it('maps a lever job and converts the epoch timestamp', () => {
    const [job] = parseLever(data, 'netflix');
    expect(job).toMatchObject({
      source: 'lever:netflix',
      title: 'Frontend Engineer',
      company: 'netflix',
      location: 'Remote',
      url: 'https://jobs.lever.co/netflix/1',
      posted_at: '1970-01-01T00:00:00.000Z',
    });
  });

  it('handles a non-array payload', () => {
    expect(parseLever({ nope: true }, 'netflix')).toEqual([]);
  });
});

describe('parseAshby', () => {
  it('prefers locationName/jobUrl with fallbacks', () => {
    const withPrimary = parseAshby(
      { jobs: [{ title: 'SRE', locationName: 'Cork', jobUrl: 'https://a/1' }] },
      'linear',
    );
    expect(withPrimary[0]).toMatchObject({ location: 'Cork', url: 'https://a/1' });

    const withFallback = parseAshby(
      { jobs: [{ title: 'SRE', location: 'Galway', applyUrl: 'https://a/2' }] },
      'linear',
    );
    expect(withFallback[0]).toMatchObject({ location: 'Galway', url: 'https://a/2' });
  });

  it('sets the source prefix to the company', () => {
    const [job] = parseAshby({ jobs: [{ title: 'X', jobUrl: 'u' }] }, 'posthog');
    expect(job?.source).toBe('ashby:posthog');
  });
});
