/** A Telegram-menu domain: a label plus the terms used to filter curated rows. */
export interface TelegramDomain {
  readonly label: string;
  readonly terms: readonly string[];
}

/**
 * The compact domain set the Telegram control panel offers. Deliberately
 * smaller than the full discovery taxonomy — these drive curated-table filters,
 * not live scraping.
 */
export const TELEGRAM_DOMAINS: readonly TelegramDomain[] = [
  { label: 'AI, Machine Learning and GenAI', terms: ['ai', 'machine learning', 'ml', 'data ai', 'analytics', 'automation', 'genai'] },
  { label: 'Software Engineering', terms: ['software', 'developer', 'engineer', 'full stack', 'backend', 'frontend'] },
  { label: 'Data Engineering', terms: ['data', 'analytics', 'data science', 'data management', 'pipeline', 'business intelligence'] },
  { label: 'Cybersecurity', terms: ['cyber', 'security', 'risk', 'technology risk', 'devsecops'] },
  { label: 'Cloud Engineering', terms: ['cloud', 'aws', 'azure', 'infrastructure', 'devops'] },
  { label: 'DevOps, Platform and Site Reliability', terms: ['devops', 'platform', 'sre', 'infrastructure', 'kubernetes'] },
  { label: 'QA and Test Automation', terms: ['qa', 'test', 'automation test', 'sdet', 'quality'] },
  { label: 'Product and Technical Product', terms: ['product', 'business analyst', 'solution engineering', 'commercial'] },
];

/** Actions the router can resolve a message to. */
export type TelegramAction =
  | 'menu'
  | 'settings'
  | 'run_scan'
  | 'latest_results'
  | 'curated_roles'
  | 'target_companies'
  | 'deadlines'
  | 'watchlist'
  | 'portals';

/** Resolve a free-text message to a Telegram domain, or null if none matches. */
export function resolveDomain(text: string | null | undefined): TelegramDomain | null {
  const clean = String(text || '').toLowerCase();
  if (clean.includes('domain: ai') || clean.includes('ai / ml') || /\b(ai|ml|genai)\b/.test(clean))
    return TELEGRAM_DOMAINS[0]!;
  if (clean.includes('domain: software') || clean.includes('software')) return TELEGRAM_DOMAINS[1]!;
  if (clean.includes('domain: data') || clean.includes('data')) return TELEGRAM_DOMAINS[2]!;
  if (clean.includes('domain: cyber') || clean.includes('cyber') || clean.includes('security'))
    return TELEGRAM_DOMAINS[3]!;
  if (clean.includes('domain: cloud') || clean.includes('cloud')) return TELEGRAM_DOMAINS[4]!;
  if (clean.includes('domain: devops') || clean.includes('devops') || clean.includes('sre'))
    return TELEGRAM_DOMAINS[5]!;
  if (clean.includes('domain: qa') || clean.includes('qa') || clean.includes('test'))
    return TELEGRAM_DOMAINS[6]!;
  if (clean.includes('domain: product') || clean.includes('product')) return TELEGRAM_DOMAINS[7]!;
  return null;
}

/** Resolve a country selection from a message, or '' if none. */
export function resolveCountry(text: string | null | undefined): 'IE' | 'UK' | 'US' | '' {
  const clean = String(text || '').toLowerCase();
  if (clean.includes('country: us') || /\b(us|usa|united states)\b/.test(clean)) return 'US';
  if (clean.includes('country: uk') || /\b(uk|gb|united kingdom|britain|england)\b/.test(clean))
    return 'UK';
  if (clean.includes('country: ie') || /\b(ie|ireland|dublin)\b/.test(clean)) return 'IE';
  return '';
}

/** Resolve a requested result count (5/10/15/20/25), or 0 if none. */
export function resolveTopN(text: string | null | undefined): number {
  const match = String(text || '').match(/\b(?:top\s*)?(5|10|15|20|25)\b/i);
  return match ? Number(match[1]) : 0;
}

/** Resolve a message to the action the control panel should take. */
export function resolveAction(text: string | null | undefined): TelegramAction {
  const clean = String(text || '')
    .trim()
    .toLowerCase();
  if (/(run live scan|run scan|scan|scrape|search)/.test(clean)) return 'run_scan';
  if (/(latest live jobs|latest jobs|live jobs|latest|results)/.test(clean)) return 'latest_results';
  if (/(curated roles|graduate roles|seed roles|best roles)/.test(clean)) return 'curated_roles';
  if (/(target companies|companies|company targets)/.test(clean)) return 'target_companies';
  if (/(deadline|urgent)/.test(clean)) return 'deadlines';
  if (/(watchlist|2027)/.test(clean)) return 'watchlist';
  if (/(portal|sources|job boards)/.test(clean)) return 'portals';
  if (/(settings|configure|config|domain:|country:|top )/.test(clean)) return 'settings';
  return 'menu';
}
