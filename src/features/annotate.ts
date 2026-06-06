import { detectVisaSignals, type VisaSignals } from './visa.js';
import { parseSalary, type SalaryInfo } from './salary.js';
import { detectWorkMode, type WorkMode } from './workmode.js';
import { computeFreshness } from './freshness.js';

/** Feature annotations attached to a job for display and filtering. */
export interface JobAnnotations {
  readonly visa: VisaSignals;
  readonly salary: SalaryInfo;
  readonly workMode: WorkMode;
  readonly ageDays: number | null;
  readonly freshnessDecay: number;
}

/** The job fields the annotators read. */
export interface Annotatable {
  readonly title?: string | null | undefined;
  readonly jd_text?: string | undefined;
  readonly location?: string | null | undefined;
  readonly posted_at?: string | null | undefined;
}

/**
 * Attach feature annotations (visa/sponsorship signals, salary, work mode and
 * freshness) to a job from its own text and dates. Pure and additive — the
 * original job is spread through unchanged.
 */
export function annotateJob<T extends Annotatable>(
  job: T,
  now: string,
): T & { annotations: JobAnnotations } {
  const text = `${job.title ?? ''} ${job.jd_text ?? ''}`;
  const freshness = computeFreshness(job.posted_at, now);
  return {
    ...job,
    annotations: {
      visa: detectVisaSignals(text),
      salary: parseSalary(text),
      workMode: detectWorkMode(`${job.title ?? ''} ${job.location ?? ''} ${job.jd_text ?? ''}`).mode,
      ageDays: freshness.ageDays,
      freshnessDecay: freshness.decay,
    },
  };
}

/** Annotate a list of jobs. */
export function annotateJobs<T extends Annotatable>(
  jobs: readonly T[],
  now: string,
): Array<T & { annotations: JobAnnotations }> {
  return jobs.map((job) => annotateJob(job, now));
}
