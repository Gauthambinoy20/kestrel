import { describe, it, expect } from 'vitest';
import { parseSalary } from '../../src/features/salary.js';

describe('parseSalary', () => {
  it('parses a symbol range with period', () => {
    expect(parseSalary('Salary: €50,000 - €70,000 per annum')).toEqual({
      found: true,
      currency: 'EUR',
      min: 50000,
      max: 70000,
      period: 'year',
    });
  });

  it('expands k amounts', () => {
    const r = parseSalary('Up to $120k');
    expect(r.currency).toBe('USD');
    expect(r.max).toBe(120000);
  });

  it('parses bare k amounts when a currency word is present', () => {
    const r = parseSalary('Pay is 50k-70k EUR depending on experience');
    expect(r.found).toBe(true);
    expect(r.currency).toBe('EUR');
    expect(r.min).toBe(50000);
    expect(r.max).toBe(70000);
  });

  it('normalises so min <= max regardless of order', () => {
    const r = parseSalary('€70,000 down from €90,000');
    expect(r.min).toBe(70000);
    expect(r.max).toBe(90000);
  });

  it('detects hourly and monthly periods', () => {
    expect(parseSalary('£25 per hour').period).toBe('hour');
    expect(parseSalary('€4,000 per month').period).toBe('month');
  });

  it('returns not-found for text with no salary', () => {
    expect(parseSalary('Great team, 5 years experience, 10 projects')).toEqual({
      found: false,
      currency: null,
      min: null,
      max: null,
      period: null,
    });
  });

  it('does not misread bare numbers without a currency cue', () => {
    expect(parseSalary('You will manage 50000 users').found).toBe(false);
  });

  it.each([null, undefined, ''])('handles empty input %p', (input) => {
    expect(parseSalary(input).found).toBe(false);
  });
});
