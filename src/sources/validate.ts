import { RawJobSchema, type ValidatedRawJob } from './schemas.js';

/** A candidate that failed validation, with human-readable issue strings. */
export interface QuarantinedJob {
  readonly input: unknown;
  readonly issues: readonly string[];
}

/** The outcome of validating a batch: clean jobs vs. quarantined ones. */
export interface ValidationResult {
  readonly valid: ValidatedRawJob[];
  readonly quarantined: QuarantinedJob[];
}

/**
 * Partition a batch of parsed candidates into valid {@link RawJob}s and
 * quarantined entries. Nothing is silently dropped: every rejected candidate is
 * retained with the reasons it failed, so a run can report exactly what came in
 * malformed from each source rather than hiding it.
 */
export function validateRawJobs(candidates: readonly unknown[]): ValidationResult {
  const valid: ValidatedRawJob[] = [];
  const quarantined: QuarantinedJob[] = [];

  for (const candidate of candidates) {
    const result = RawJobSchema.safeParse(candidate);
    if (result.success) {
      valid.push(result.data);
    } else {
      quarantined.push({
        input: candidate,
        issues: result.error.issues.map(
          (issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`,
        ),
      });
    }
  }

  return { valid, quarantined };
}
