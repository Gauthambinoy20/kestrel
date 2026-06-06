import { describe, it, expect } from 'vitest';
import { computeFreshness } from '../../src/features/freshness.js';

const now = '2026-06-30T00:00:00.000Z';

describe('computeFreshness', () => {
  it('is fresh with full decay for a posting today', () => {
    expect(computeFreshness('2026-06-30T00:00:00.000Z', now)).toEqual({
      ageDays: 0,
      isFresh: true,
      decay: 1,
    });
  });

  it('decays linearly with age', () => {
    expect(computeFreshness('2026-06-15T00:00:00.000Z', now).decay).toBeCloseTo(0.5);
  });

  it('reaches zero decay past the max window', () => {
    const r = computeFreshness('2026-05-01T00:00:00.000Z', now);
    expect(r.decay).toBe(0);
    expect(r.isFresh).toBe(false);
  });

  it('marks recent posts within the fresh window', () => {
    expect(computeFreshness('2026-06-25T00:00:00.000Z', now).isFresh).toBe(true);
    expect(computeFreshness('2026-06-20T00:00:00.000Z', now).isFresh).toBe(false);
  });

  it('treats an unknown date as neutral (decay 1, not fresh)', () => {
    expect(computeFreshness(null, now)).toEqual({ ageDays: null, isFresh: false, decay: 1 });
  });

  it('clamps a future date to age zero', () => {
    expect(computeFreshness('2026-07-15T00:00:00.000Z', now).ageDays).toBe(0);
  });

  it('respects custom windows', () => {
    const r = computeFreshness('2026-06-20T00:00:00.000Z', now, { freshDays: 14, maxDays: 60 });
    expect(r.isFresh).toBe(true);
  });
});
