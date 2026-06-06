import { describe, it, expect } from 'vitest';
import { parseRemoteOk, parseScrapeGraphAi } from '../../../src/sources/parsers/misc.js';
import { validateRawJobs } from '../../../src/sources/validate.js';

describe('parseRemoteOk', () => {
  const data = [
    { legal: 'RemoteOK notice — first element is not a job' },
    {
      position: 'Full Stack Engineer',
      company: 'Zapier',
      url: 'https://remoteok.com/jobs/1',
      description: '<p>Build things</p>',
      date: '2026-05-28',
    },
    { position: 'Backend Engineer', company: 'Doist', url: 'https://remoteok.com/jobs/2' },
  ];

  it('drops the first legal element and maps the rest', () => {
    const jobs = parseRemoteOk(data);
    expect(jobs).toHaveLength(2);
    expect(jobs[0]).toMatchObject({
      source: 'remoteok',
      title: 'Full Stack Engineer',
      company: 'Zapier',
      url: 'https://remoteok.com/jobs/1',
    });
    expect(jobs[0]?.jd_text).not.toContain('<');
  });

  it('defaults location to Remote when absent', () => {
    const jobs = parseRemoteOk(data);
    expect(jobs[1]?.location).toBe('Remote');
  });

  it('returns [] for a non-array payload', () => {
    expect(parseRemoteOk({})).toEqual([]);
  });

  it('validates cleanly', () => {
    expect(validateRawJobs(parseRemoteOk(data)).valid).toHaveLength(2);
  });
});

describe('parseScrapeGraphAi', () => {
  it('reads jobs from result.jobs and derives the company from the label', () => {
    const jobs = parseScrapeGraphAi(
      { result: { jobs: [{ title: 'SWE', location: 'Dublin', url: 'https://g/1', department: 'Eng' }] } },
      'sgai:google-careers',
    );
    expect(jobs[0]).toMatchObject({
      source: 'sgai:google-careers',
      title: 'SWE',
      company: 'google',
      location: 'Dublin',
      url: 'https://g/1',
      jd_text: 'Eng',
    });
  });

  it('falls back to a top-level jobs array', () => {
    const jobs = parseScrapeGraphAi(
      { jobs: [{ title: 'SWE', url: 'https://a/1' }] },
      'sgai:apple-careers',
    );
    expect(jobs).toHaveLength(1);
    expect(jobs[0]?.company).toBe('apple');
  });

  it('returns [] when there are no jobs anywhere', () => {
    expect(parseScrapeGraphAi({}, 'sgai:meta-careers')).toEqual([]);
  });
});
