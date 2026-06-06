/** Types describing the IT-domain taxonomy that drives discovery and matching. */

/**
 * A single locked IT domain. This is the authored, config-style shape — the
 * source of truth a human edits to add or tune a domain.
 */
export interface Domain {
  /** Stable machine identifier, e.g. `ai_ml_genai`. */
  readonly slug: string;
  /** Human-facing label, e.g. `AI, Machine Learning and GenAI`. */
  readonly label: string;
  /** Free-text aliases a user might type to select this domain. */
  readonly inputAliases: readonly string[];
  /** Queries sent to aggregator APIs (Adzuna, Jooble, SerpAPI). */
  readonly searchQueries: readonly string[];
  /** Canonical role titles used to match scraped jobs to this domain. */
  readonly coreRoles: readonly string[];
  /** Keyword terms scored against a job's title + description + company. */
  readonly terms: readonly string[];
}

/**
 * A {@link Domain} after enrichment: pre-computed alias variants and normalised
 * lookup tables, so the hot matching path does no per-job string building.
 */
export interface EnrichedDomain extends Domain {
  /** Every generated title alias (core roles × prefix/suffix variants). */
  readonly aliases: readonly string[];
  /** Normalised, de-duplicated alias needles (length ≥ 4) for substring matching. */
  readonly aliasNeedles: readonly string[];
  /** Count of generated aliases (surfaced in run metadata). */
  readonly aliasCount: number;
  /** Normalised slug + label + input aliases, for domain resolution. */
  readonly normalizedInputs: readonly string[];
  /** Normalised keyword terms, for scoring. */
  readonly normalizedTerms: readonly string[];
}
