import { TELEGRAM_DOMAINS } from './router.js';

/** Quote and escape a value as a Postgres string literal (doubles single quotes). */
export function sqlString(value: string | number | null | undefined): string {
  return `'${String(value || '').replace(/'/g, "''")}'`;
}

/** Columns scanned when filtering curated roles by domain terms. */
const ROLE_COLUMNS = ['role_title', 'sector', 'location', 'notes', 'fit_reason'];

/** Build an OR of ILIKE clauses matching a domain's terms across role columns. */
function domainWhere(domainLabel: string): string {
  const domain = TELEGRAM_DOMAINS.find((d) => d.label === domainLabel) ?? TELEGRAM_DOMAINS[0]!;
  const clauses: string[] = [];
  for (const term of domain.terms) {
    for (const col of ROLE_COLUMNS) {
      clauses.push(`${col} ILIKE ${sqlString(`%${term}%`)}`);
    }
  }
  return `(${clauses.join(' OR ')})`;
}

/** Preferences that parameterise a curated query. */
export interface CuratedPrefs {
  readonly domain: string;
  readonly top_n: number;
}

/**
 * Build the read-only SQL for a curated Telegram action against the seed
 * tables. The row limit is clamped to 5–25, term interpolation is escaped via
 * {@link sqlString}, and an unknown action yields a harmless empty result.
 */
export function curatedSql(action: string, prefs: CuratedPrefs): string {
  const limit = Math.max(5, Math.min(25, Number(prefs.top_n || 10)));

  switch (action) {
    case 'curated_roles':
      return `SELECT 'curated_roles' AS result_type, company, role_title, sector, location, status, apply_link, COALESCE(NULLIF(apply_url, ''), apply_link) AS link, deadline_text, stamp_1g_ok, notes, fit_reason, priority_action, priority_score FROM curated_roles WHERE ${domainWhere(prefs.domain)} ORDER BY priority_score DESC, id LIMIT ${limit};`;
    case 'target_companies':
      return `SELECT 'target_companies' AS result_type, company_name AS company, sector, COALESCE(NULLIF(website_url, ''), website_text) AS link, how_to_apply, priority_score FROM curated_companies ORDER BY priority_score DESC, company_name LIMIT ${limit};`;
    case 'deadlines':
      return `SELECT 'deadlines' AS result_type, company, role_title, deadline_text, action, link, priority_score FROM curated_deadlines ORDER BY priority_score DESC, id LIMIT ${limit};`;
    case 'watchlist':
      return `SELECT 'watchlist' AS result_type, company, programme, expected_opening, notes, priority_score FROM curated_watchlist ORDER BY priority_score DESC, company LIMIT ${limit};`;
    case 'portals':
      return `SELECT 'portals' AS result_type, portal, url, best_for, results_summary, quick_tip, usefulness, priority_score FROM curated_portals ORDER BY priority_score DESC, portal LIMIT ${limit};`;
    default:
      return `SELECT 'empty' AS result_type WHERE false;`;
  }
}
