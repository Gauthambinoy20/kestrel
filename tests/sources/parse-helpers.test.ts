import { describe, it, expect } from 'vitest';
import {
  asRecord,
  asArray,
  arrayAt,
  str,
  stripHtml,
  clip,
  toIso,
} from '../../src/sources/parse-helpers.js';

describe('asRecord', () => {
  it.each([
    [{ a: 1 }, { a: 1 }],
    [null, {}],
    [undefined, {}],
    [42, {}],
    ['str', {}],
    [[], {}],
  ])('coerces %p', (input, expected) => {
    expect(asRecord(input)).toEqual(expected);
  });
});

describe('asArray', () => {
  it('passes arrays through and rejects non-arrays', () => {
    expect(asArray([1, 2])).toEqual([1, 2]);
    expect(asArray({ length: 2 })).toEqual([]);
    expect(asArray(null)).toEqual([]);
  });
});

describe('arrayAt', () => {
  it('reads an array at a key', () => {
    expect(arrayAt({ jobs: [1, 2] }, 'jobs')).toEqual([1, 2]);
  });
  it('returns [] when the key is missing or not an array', () => {
    expect(arrayAt({ jobs: 'x' }, 'jobs')).toEqual([]);
    expect(arrayAt(null, 'jobs')).toEqual([]);
  });
});

describe('str', () => {
  it.each([
    ['hello', 'hello'],
    [1, undefined],
    [null, undefined],
    [{}, undefined],
  ])('returns string or undefined for %p', (input, expected) => {
    expect(str(input)).toBe(expected);
  });
});

describe('stripHtml', () => {
  it('removes tags and caps length', () => {
    const out = stripHtml('<p>Hi <b>there</b></p>');
    expect(out).not.toContain('<');
    expect(out).toContain('Hi');
    expect(out).toContain('there');
    expect(stripHtml('abcdef', 3)).toBe('abc');
  });
  it('returns empty string for non-strings', () => {
    expect(stripHtml(null)).toBe('');
  });
});

describe('clip', () => {
  it('truncates strings', () => {
    expect(clip('abcdef', 3)).toBe('abc');
    expect(clip(123)).toBe('');
  });
});

describe('toIso', () => {
  it('converts a millisecond epoch number', () => {
    expect(toIso(0)).toBe('1970-01-01T00:00:00.000Z');
  });
  it('converts an ISO-ish string', () => {
    expect(toIso('2026-06-01T00:00:00.000Z')).toBe('2026-06-01T00:00:00.000Z');
  });
  it.each([null, undefined, {}, 'not-a-date'])('returns undefined for %p', (input) => {
    expect(toIso(input)).toBeUndefined();
  });
});
