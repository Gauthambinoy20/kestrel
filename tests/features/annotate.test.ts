import { describe, it, expect } from 'vitest';
import { annotateJob, annotateJobs } from '../../src/features/annotate.js';

const now = '2026-06-30T00:00:00.000Z';

describe('annotateJob', () => {
  it('attaches visa, salary, work-mode and freshness annotations', () => {
    const job = {
      title: 'Machine Learning Engineer',
      jd_text: 'Visa sponsorship available. Salary €60,000 - €80,000 per annum. Fully remote.',
      location: 'Dublin, Ireland',
      posted_at: '2026-06-28T00:00:00.000Z',
    };
    const { annotations } = annotateJob(job, now);
    expect(annotations.visa.sponsorshipOffered).toBe(true);
    expect(annotations.salary).toMatchObject({ currency: 'EUR', min: 60000, max: 80000 });
    expect(annotations.workMode).toBe('remote');
    expect(annotations.ageDays).toBe(2);
    expect(annotations.freshnessDecay).toBeGreaterThan(0);
  });

  it('preserves the original job fields', () => {
    const job = { title: 'X', extra: 42 };
    const out = annotateJob(job, now);
    expect(out.extra).toBe(42);
    expect(out.title).toBe('X');
  });

  it('produces empty-ish annotations for a sparse job', () => {
    const { annotations } = annotateJob({ title: 'Engineer' }, now);
    expect(annotations.visa.signals).toEqual([]);
    expect(annotations.salary.found).toBe(false);
    expect(annotations.workMode).toBe('unknown');
    expect(annotations.ageDays).toBeNull();
  });
});

describe('annotateJobs', () => {
  it('annotates every job', () => {
    const out = annotateJobs([{ title: 'A' }, { title: 'B' }], now);
    expect(out).toHaveLength(2);
    expect(out.every((j) => 'annotations' in j)).toBe(true);
  });
});
