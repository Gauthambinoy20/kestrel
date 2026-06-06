import { describe, it, expect } from 'vitest';
import { validateRawJobs } from '../../src/sources/validate.js';

const good = (n: number) => ({
  source: 'gh:acme',
  title: `Engineer ${n}`,
  url: `https://acme.example/jobs/${n}`,
});

describe('validateRawJobs', () => {
  it('returns empty partitions for empty input', () => {
    expect(validateRawJobs([])).toEqual({ valid: [], quarantined: [] });
  });

  it('keeps all valid jobs', () => {
    const { valid, quarantined } = validateRawJobs([good(1), good(2), good(3)]);
    expect(valid).toHaveLength(3);
    expect(quarantined).toHaveLength(0);
  });

  it('quarantines all invalid jobs', () => {
    const { valid, quarantined } = validateRawJobs([{ source: 's' }, null, 42, 'nope']);
    expect(valid).toHaveLength(0);
    expect(quarantined).toHaveLength(4);
  });

  it('partitions a mixed batch and never drops anything', () => {
    const batch = [good(1), { source: 's', title: '', url: 'u' }, good(2), {}];
    const { valid, quarantined } = validateRawJobs(batch);
    expect(valid).toHaveLength(2);
    expect(quarantined).toHaveLength(2);
    expect(valid.length + quarantined.length).toBe(batch.length);
  });

  it('records the failing field path in the issue strings', () => {
    const { quarantined } = validateRawJobs([{ source: 's', title: '', url: 'u' }]);
    expect(quarantined[0]?.issues.some((i) => i.startsWith('title:'))).toBe(true);
  });

  it('retains the original input on quarantined entries', () => {
    const bad = { source: 's', title: 123, url: 'u' };
    const { quarantined } = validateRawJobs([bad]);
    expect(quarantined[0]?.input).toBe(bad);
  });
});
