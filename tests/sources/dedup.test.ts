import { describe, it, expect } from 'vitest';
import { dedupeByUrl } from '../../src/sources/dedup.js';

describe('dedupeByUrl', () => {
  it('keeps the first occurrence of a duplicate URL', () => {
    const jobs = [
      { url: 'https://acme.com/jobs/1', n: 'a' },
      { url: 'https://acme.com/jobs/1', n: 'b' },
    ];
    const out = dedupeByUrl(jobs);
    expect(out).toHaveLength(1);
    expect(out[0]?.n).toBe('a');
  });

  it('treats case/punctuation-only differences as the same URL', () => {
    const jobs = [{ url: 'https://Acme.com/Jobs/1' }, { url: 'https://acme.com/jobs/1' }];
    expect(dedupeByUrl(jobs)).toHaveLength(1);
  });

  it('keeps genuinely distinct URLs', () => {
    const jobs = [{ url: 'https://a.com/1' }, { url: 'https://a.com/2' }];
    expect(dedupeByUrl(jobs)).toHaveLength(2);
  });

  it('drops entries with an empty/unusable URL', () => {
    const jobs = [{ url: '' }, { url: '   ' }, { url: 'https://a.com/1' }];
    expect(dedupeByUrl(jobs)).toHaveLength(1);
  });

  it('returns an empty array for empty input', () => {
    expect(dedupeByUrl([])).toEqual([]);
  });

  it('preserves order of first occurrences', () => {
    const jobs = [{ url: 'https://a/1' }, { url: 'https://a/2' }, { url: 'https://a/1' }];
    expect(dedupeByUrl(jobs).map((j) => j.url)).toEqual(['https://a/1', 'https://a/2']);
  });
});
