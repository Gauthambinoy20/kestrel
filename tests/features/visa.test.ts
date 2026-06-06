import { describe, it, expect } from 'vitest';
import { detectVisaSignals } from '../../src/features/visa.js';

describe('detectVisaSignals', () => {
  it('detects an explicit sponsorship offer', () => {
    const r = detectVisaSignals('We offer visa sponsorship for the right candidate.');
    expect(r.sponsorshipOffered).toBe(true);
    expect(r.signals.length).toBeGreaterThan(0);
  });

  it('detects denial / right-to-work requirement', () => {
    const r = detectVisaSignals('Applicants must already have the right to work in Ireland.');
    expect(r.sponsorshipDenied).toBe(true);
  });

  it('detects "no sponsorship"', () => {
    expect(detectVisaSignals('No visa sponsorship is available.').sponsorshipDenied).toBe(true);
  });

  it('detects graduate / Stamp 1G friendliness', () => {
    expect(detectVisaSignals('Open to Stamp 1G holders and recent graduates.').graduateFriendly).toBe(
      true,
    );
  });

  it('flags nothing for a neutral description', () => {
    const r = detectVisaSignals('Build backend services in Go.');
    expect(r.sponsorshipOffered).toBe(false);
    expect(r.sponsorshipDenied).toBe(false);
    expect(r.graduateFriendly).toBe(false);
    expect(r.signals).toEqual([]);
  });

  it('can report both an offer and a denial in a mixed JD', () => {
    const r = detectVisaSignals(
      'Visa sponsorship available for senior roles; for this role you must have the right to work.',
    );
    expect(r.sponsorshipOffered).toBe(true);
    expect(r.sponsorshipDenied).toBe(true);
  });

  it.each([null, undefined, ''])('handles empty input %p', (input) => {
    expect(detectVisaSignals(input).signals).toEqual([]);
  });
});
