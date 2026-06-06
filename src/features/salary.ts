/** Normalised salary information extracted from a job's text. */
export interface SalaryInfo {
  readonly found: boolean;
  readonly currency: 'EUR' | 'GBP' | 'USD' | null;
  readonly min: number | null;
  readonly max: number | null;
  readonly period: 'year' | 'month' | 'day' | 'hour' | null;
}

const SYMBOL_CURRENCY: Record<string, 'EUR' | 'GBP' | 'USD'> = { '€': 'EUR', '£': 'GBP', $: 'USD' };

const WORD_CURRENCY: Array<[RegExp, 'EUR' | 'GBP' | 'USD']> = [
  [/\b(eur|euro)s?\b/i, 'EUR'],
  [/\b(gbp|pound)s?\b/i, 'GBP'],
  [/\b(usd|dollar)s?\b/i, 'USD'],
];

const PERIODS: Array<[RegExp, 'year' | 'month' | 'day' | 'hour']> = [
  [/per annum|annually|\bp\.?a\.?\b|\/\s*year|per year|a year|yearly/i, 'year'],
  [/per month|\/\s*month|monthly/i, 'month'],
  [/per day|\/\s*day|daily/i, 'day'],
  [/per hour|\/\s*hour|hourly|per hr|\/\s*hr/i, 'hour'],
];

const SYMBOL_AMOUNT = /([€£$])\s?(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)\s?(k)?/gi;
const K_AMOUNT = /\b(\d{2,3})k\b/gi;

function toNumber(raw: string, hasK: boolean): number {
  const n = Number(raw.replace(/,/g, ''));
  return hasK ? n * 1000 : n;
}

function detectPeriod(text: string): SalaryInfo['period'] {
  for (const [re, period] of PERIODS) if (re.test(text)) return period;
  return null;
}

function detectWordCurrency(text: string): 'EUR' | 'GBP' | 'USD' | null {
  for (const [re, cur] of WORD_CURRENCY) if (re.test(text)) return cur;
  return null;
}

/**
 * Parse a salary range from a job's text. Prefers explicit currency-symbol
 * amounts (`€50,000 - €70,000`, `$120k`) and falls back to bare `k` amounts
 * (`50k-70k`) when a currency word is present. `k` is expanded to thousands and
 * the range is normalised so `min <= max`. Conservative: no symbol/`k` → no
 * salary, so arbitrary numbers in a JD are never misread as pay.
 */
export function parseSalary(text: string | null | undefined): SalaryInfo {
  const t = String(text || '');
  const none: SalaryInfo = { found: false, currency: null, min: null, max: null, period: null };

  const amounts: number[] = [];
  let currency: 'EUR' | 'GBP' | 'USD' | null = null;

  for (const m of t.matchAll(SYMBOL_AMOUNT)) {
    currency ??= SYMBOL_CURRENCY[m[1]!] ?? null;
    amounts.push(toNumber(m[2]!, Boolean(m[3])));
  }

  if (amounts.length === 0) {
    const wordCurrency = detectWordCurrency(t);
    if (wordCurrency) {
      for (const m of t.matchAll(K_AMOUNT)) amounts.push(toNumber(m[1]!, true));
      currency = wordCurrency;
    }
  }

  if (amounts.length === 0) return none;

  return {
    found: true,
    currency,
    min: Math.min(...amounts),
    max: Math.max(...amounts),
    period: detectPeriod(t),
  };
}
