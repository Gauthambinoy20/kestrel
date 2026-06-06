import { describe, it, expect } from 'vitest';
import {
  parseAdzuna,
  parseJooble,
  parseSerpApi,
} from '../../../src/sources/parsers/aggregators.js';
import { validateRawJobs } from '../../../src/sources/validate.js';

describe('parseAdzuna', () => {
  const data = {
    results: [
      {
        title: 'Data Engineer',
        company: { display_name: 'Acme' },
        location: { display_name: 'Dublin' },
        redirect_url: 'https://adzuna/job/1',
        description: 'ETL pipelines',
        created: '2026-05-30T00:00:00Z',
      },
    ],
  };

  it('maps a flattened adzuna job', () => {
    const [job] = parseAdzuna(data);
    expect(job).toMatchObject({
      source: 'adzuna',
      title: 'Data Engineer',
      company: 'Acme',
      location: 'Dublin',
      url: 'https://adzuna/job/1',
      posted_at: '2026-05-30T00:00:00Z',
    });
  });

  it('returns [] for a malformed payload', () => {
    expect(parseAdzuna({})).toEqual([]);
    expect(parseAdzuna(null)).toEqual([]);
  });

  it('validates cleanly', () => {
    expect(validateRawJobs(parseAdzuna(data)).valid).toHaveLength(1);
  });
});

describe('parseJooble', () => {
  it('maps a jooble job', () => {
    const [job] = parseJooble({
      jobs: [
        {
          title: 'Cloud Engineer',
          company: 'Globex',
          location: 'Remote',
          link: 'https://jooble/1',
          snippet: 'AWS',
          updated: '2026-05-29',
        },
      ],
    });
    expect(job).toMatchObject({
      source: 'jooble',
      title: 'Cloud Engineer',
      company: 'Globex',
      url: 'https://jooble/1',
    });
  });
});

describe('parseSerpApi', () => {
  it('uses the first related link as the apply URL', () => {
    const [job] = parseSerpApi({
      jobs_results: [
        {
          title: 'QA Engineer',
          company_name: 'Initech',
          location: 'Cork',
          related_links: [{ link: 'https://primary/1' }],
          share_link: 'https://share/1',
        },
      ],
    });
    expect(job?.url).toBe('https://primary/1');
  });

  it('falls back to the share link when there is no related link', () => {
    const [job] = parseSerpApi({
      jobs_results: [{ title: 'QA Engineer', share_link: 'https://share/2' }],
    });
    expect(job?.url).toBe('https://share/2');
  });
});
