import type { SalaryInfo, WorkMode } from './types.js';

const CURRENCY_SYMBOL: Record<string, string> = { EUR: '€', GBP: '£', USD: '$' };

/** Format a parsed salary as a compact human string, or null when absent. */
export function formatSalary(salary: SalaryInfo): string | null {
  if (!salary.found || salary.min === null) return null;
  const symbol = salary.currency ? (CURRENCY_SYMBOL[salary.currency] ?? '') : '';
  const k = (n: number): string => (n >= 1000 ? `${Math.round(n / 1000)}k` : String(n));
  const range =
    salary.max !== null && salary.max !== salary.min
      ? `${symbol}${k(salary.min)}–${symbol}${k(salary.max)}`
      : `${symbol}${k(salary.min)}`;
  return salary.period ? `${range}/${salary.period}` : range;
}

/** Human label for a work mode. */
export function workModeLabel(mode: WorkMode): string {
  return { remote: 'Remote', hybrid: 'Hybrid', onsite: 'On-site', unknown: 'Unspecified' }[mode];
}

/** Relative age label from whole days, or null when unknown. */
export function ageLabel(ageDays: number | null): string | null {
  if (ageDays === null) return null;
  if (ageDays <= 0) return 'today';
  if (ageDays === 1) return '1 day ago';
  if (ageDays < 30) return `${String(ageDays)} days ago`;
  return '30+ days ago';
}
