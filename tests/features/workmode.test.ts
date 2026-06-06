import { describe, it, expect } from 'vitest';
import { detectWorkMode } from '../../src/features/workmode.js';

describe('detectWorkMode', () => {
  it.each([
    ['Fully remote, work from home', 'remote'],
    ['Hybrid - 3 days in office', 'hybrid'],
    ['On-site in Dublin', 'onsite'],
    ['In-person collaboration required', 'onsite'],
    ['Build great software', 'unknown'],
  ])('classifies "%s" as %s', (text, mode) => {
    expect(detectWorkMode(text).mode).toBe(mode);
  });

  it('prefers hybrid when both hybrid and remote appear', () => {
    expect(detectWorkMode('Hybrid role with some remote days').mode).toBe('hybrid');
  });

  it('prefers remote over onsite when both appear (no hybrid)', () => {
    expect(detectWorkMode('Primarily remote, occasional on-site meetups').mode).toBe('remote');
  });

  it('reports the matched signals', () => {
    expect(detectWorkMode('WFH').signals.length).toBeGreaterThan(0);
  });

  it.each([null, undefined, ''])('handles empty input %p', (input) => {
    expect(detectWorkMode(input).mode).toBe('unknown');
  });
});
