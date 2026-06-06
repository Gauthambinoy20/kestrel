/**
 * Postgres INSERT building for the live `jobs` table. Kept as pure string
 * construction so it can be unit-tested for escaping and defaults without a
 * database. All interpolation goes through {@link pgEscape}/{@link pgNumeric}/
 * {@link pgTimestamp}, so caller data cannot break out of a literal.
 */

/** Render a value as a safe Postgres literal (NULL / number / bool / quoted text). */
export function pgEscape(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '0';
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  return `'${String(value).replace(/'/g, "''")}'`;
}

/** Render a numeric literal, falling back when the value is not finite. */
export function pgNumeric(value: unknown, fallback = 0): string {
  const n = Number(value);
  return Number.isFinite(n) ? String(n) : String(fallback);
}

/** Render an ISO timestamp literal, using `fallbackIso` when the value is invalid. */
export function pgTimestamp(value: string | null | undefined, fallbackIso: string): string {
  const date = new Date(value || fallbackIso);
  const iso = Number.isNaN(date.getTime()) ? new Date(fallbackIso).toISOString() : date.toISOString();
  return `${pgEscape(iso)}::timestamp`;
}

/** Whether a title reads as entry-level (sets the is_graduate column). */
export function isEntryLevelTitle(title: string | null | undefined): boolean {
  return /\b(junior|jr|graduate|new grad|entry level|early career|trainee|apprentice|associate)\b/i.test(
    String(title || ''),
  );
}

/** The job fields used to build an INSERT row. */
export interface JobRow {
  company?: string | null;
  title?: string | null;
  location?: string | null;
  country?: string | null;
  jd_text?: string | null;
  url?: string | null;
  source?: string | null;
  posted_at?: string | null;
  match_score?: number | null;
  remote_type?: string | null;
  domain_slug?: string | null;
  domain_label?: string | null;
  matched_role?: string | null;
  matched_alias?: string | null;
  keyword_hits?: string | null;
  alias_count?: number | null;
  telegram_chat_id?: string | null;
}

const COLUMNS = [
  'company',
  'title',
  'location',
  'country',
  'jd_full_text',
  'original_url',
  'source',
  'posted_date',
  'match_score',
  'job_type',
  'is_graduate',
  'experience_years_max',
];

/**
 * Build the upsert for one job against the live `jobs` table: INSERT … ON
 * CONFLICT (original_url) DO UPDATE, with a RETURNING clause that echoes the
 * match metadata (domain, role, alias, score, keyword hits) back to the
 * workflow. `nowIso` is the timestamp fallback for a missing posted date.
 */
export function buildSql(job: JobRow, nowIso: string): string {
  const values = [
    pgEscape(job.company || 'Unknown'),
    pgEscape(job.title || 'Untitled role'),
    pgEscape(job.location || job.country || 'Unknown'),
    pgEscape(job.country || 'IE'),
    pgEscape(job.jd_text || ''),
    pgEscape(job.url),
    pgEscape(String(job.source || 'unknown').slice(0, 50)),
    pgTimestamp(job.posted_at, nowIso),
    pgNumeric(job.match_score, 0),
    pgEscape(job.remote_type || null),
    pgEscape(isEntryLevelTitle(job.title)),
    '0',
  ];

  const returning = [
    'id',
    'title',
    'company',
    'location',
    'original_url AS url',
    'jd_full_text AS jd_text',
    'md5(original_url) AS hash',
    'source',
    '(xmax = 0) AS is_new',
    `${pgEscape(job.domain_slug)} AS domain_slug`,
    `${pgEscape(job.domain_label)} AS domain_label`,
    `${pgEscape(job.matched_role)} AS matched_role`,
    `${pgEscape(job.matched_alias)} AS matched_alias`,
    `${Math.round(Number(job.match_score || 0))} AS match_score`,
    `${pgEscape(job.keyword_hits || '')} AS keyword_hits`,
    `${Number(job.alias_count || 0)} AS alias_count`,
    `${pgEscape(job.telegram_chat_id || '')} AS telegram_chat_id`,
  ].join(', ');

  return (
    `INSERT INTO jobs (${COLUMNS.join(',')}) VALUES (${values.join(',')}) ` +
    `ON CONFLICT (original_url) DO UPDATE SET company=EXCLUDED.company, title=EXCLUDED.title, ` +
    `location=EXCLUDED.location, country=EXCLUDED.country, jd_full_text=EXCLUDED.jd_full_text, ` +
    `source=EXCLUDED.source, posted_date=COALESCE(EXCLUDED.posted_date, jobs.posted_date), ` +
    `match_score=EXCLUDED.match_score, job_type=EXCLUDED.job_type, is_graduate=EXCLUDED.is_graduate, ` +
    `updated_at=CURRENT_TIMESTAMP RETURNING ${returning};`
  );
}
