/** Types for raw jobs as they emerge from source parsers, before matching. */

/**
 * A job in its normalised-but-unmatched form: every source parser maps its
 * provider-specific payload into this shape. `title`, `url` and `source` are
 * the only hard requirements; everything else is best-effort.
 */
export interface RawJob {
  /** Source identifier, e.g. `adzuna` or `gh:stripe`. */
  readonly source: string;
  /** Job title (required — a job without one is unusable). */
  readonly title: string;
  /** Hiring company, when the source provides it. */
  readonly company?: string | null | undefined;
  /** Free-text location, when provided. */
  readonly location?: string | null | undefined;
  /** Apply/detail URL (required). */
  readonly url: string;
  /** Job description text, possibly truncated by the parser. */
  readonly jd_text?: string | undefined;
  /** Posted/updated timestamp as provided by the source. */
  readonly posted_at?: string | null | undefined;
  /** The untouched source record, retained for debugging/enrichment. */
  readonly raw?: unknown;
}
