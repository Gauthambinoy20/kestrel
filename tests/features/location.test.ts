import { describe, it, expect } from 'vitest';
import { normalizeLocation } from '../../src/features/location.js';

describe('normalizeLocation', () => {
  it('parses city and country', () => {
    expect(normalizeLocation('Dublin, Ireland')).toMatchObject({
      city: 'Dublin',
      country: 'IE',
      remote: false,
    });
  });

  it('detects country from a major city alone', () => {
    expect(normalizeLocation('London').country).toBe('UK');
    expect(normalizeLocation('San Francisco, CA').country).toBe('US');
  });

  it('flags remote and nulls the city for remote-only locations', () => {
    const r = normalizeLocation('Remote - EU');
    expect(r.remote).toBe(true);
    expect(r.city).toBeNull();
  });

  it('keeps an unknown city with a null country', () => {
    const r = normalizeLocation('Reykjavik');
    expect(r.city).toBe('Reykjavik');
    expect(r.country).toBeNull();
  });

  it('takes the first segment as the city', () => {
    expect(normalizeLocation('Cork, Munster, Ireland').city).toBe('Cork');
  });

  it.each([null, undefined, ''])('handles empty input %p', (input) => {
    expect(normalizeLocation(input)).toEqual({ raw: '', city: null, country: null, remote: false });
  });
});
