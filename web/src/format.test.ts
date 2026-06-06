import { describe, it, expect } from 'vitest';
import { formatSalary, workModeLabel, ageLabel } from './format.js';
import type { SalaryInfo } from './types.js';

const salary = (over: Partial<SalaryInfo>): SalaryInfo => ({
  found: true,
  currency: 'EUR',
  min: 50000,
  max: 70000,
  period: 'year',
  ...over,
});

describe('formatSalary', () => {
  it('formats a range with symbol, k and period', () => {
    expect(formatSalary(salary({}))).toBe('€50k–€70k/year');
  });
  it('formats a single value', () => {
    expect(formatSalary(salary({ max: null }))).toBe('€50k/year');
  });
  it('returns null when not found', () => {
    expect(formatSalary(salary({ found: false, min: null }))).toBeNull();
  });
});

describe('workModeLabel', () => {
  it.each([
    ['remote', 'Remote'],
    ['hybrid', 'Hybrid'],
    ['onsite', 'On-site'],
    ['unknown', 'Unspecified'],
  ] as const)('labels %s', (mode, label) => {
    expect(workModeLabel(mode)).toBe(label);
  });
});

describe('ageLabel', () => {
  it.each([
    [null, null],
    [0, 'today'],
    [1, '1 day ago'],
    [5, '5 days ago'],
    [45, '30+ days ago'],
  ])('labels %p as %p', (days, expected) => {
    expect(ageLabel(days)).toBe(expected);
  });
});
