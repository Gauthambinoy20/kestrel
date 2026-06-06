import { z } from 'zod';

/**
 * Validation schema for a {@link RawJob}. This is the gate every parsed job
 * passes through before entering the pipeline: it enforces a non-empty source,
 * title and url, coerces the optional fields, and preserves the raw record.
 *
 * The schema is intentionally strict on the three required fields and lenient
 * elsewhere — real provider payloads are messy, and we would rather keep a job
 * with a missing location than drop it.
 */
export const RawJobSchema = z.object({
  source: z.string().trim().min(1),
  title: z.string().trim().min(1),
  company: z.string().nullish(),
  location: z.string().nullish(),
  url: z.string().trim().min(1),
  jd_text: z.string().optional(),
  posted_at: z.string().nullish(),
  raw: z.unknown().optional(),
});

/** A job validated against {@link RawJobSchema}. */
export type ValidatedRawJob = z.infer<typeof RawJobSchema>;
