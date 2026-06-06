import { describe, it, expect } from 'vitest';
import { stableHash } from '../../src/util/hash.js';

describe('stableHash', () => {
  it('returns 32 lowercase hex characters', () => {
    expect(stableHash('https://acme.com/jobs/1')).toMatch(/^[0-9a-f]{32}$/);
  });

  it('is deterministic for the same input', () => {
    const a = stableHash('https://acme.com/jobs/1');
    const b = stableHash('https://acme.com/jobs/1');
    expect(a).toBe(b);
  });

  it('produces different hashes for different inputs', () => {
    expect(stableHash('https://a.com/1')).not.toBe(stableHash('https://a.com/2'));
  });

  it('treats null, undefined and empty string alike', () => {
    const empty = stableHash('');
    expect(stableHash(null)).toBe(empty);
    expect(stableHash(undefined)).toBe(empty);
  });

  it('is sensitive to small changes', () => {
    expect(stableHash('abc')).not.toBe(stableHash('abd'));
  });

  it('accepts numbers', () => {
    expect(stableHash(12345)).toMatch(/^[0-9a-f]{32}$/);
  });
});
