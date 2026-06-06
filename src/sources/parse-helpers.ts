import { z } from 'zod';

/**
 * Safe extraction helpers for navigating untrusted provider payloads without
 * `any`. Each helper degrades gracefully: a wrong-shaped value yields an empty
 * record/array or `undefined` rather than throwing, so a single odd record
 * never derails a parse. The downstream {@link validateRawJobs} gate decides
 * what is actually usable.
 */

const RecordSchema = z.record(z.unknown());
const ArraySchema = z.array(z.unknown());

/** A parser output: a best-effort job that still faces schema validation. */
export interface RawJobCandidate {
  source: string;
  title?: string | undefined;
  company?: string | null | undefined;
  location?: string | null | undefined;
  url?: string | undefined;
  jd_text?: string | undefined;
  posted_at?: string | null | undefined;
  raw?: unknown;
}

/** Coerce a value to a string record, or `{}` if it is not an object. */
export function asRecord(value: unknown): Record<string, unknown> {
  const parsed = RecordSchema.safeParse(value);
  return parsed.success ? parsed.data : {};
}

/** Coerce a value to an array, or `[]` if it is not one. */
export function asArray(value: unknown): unknown[] {
  const parsed = ArraySchema.safeParse(value);
  return parsed.success ? parsed.data : [];
}

/** Read an array living at `key` on an object value, or `[]`. */
export function arrayAt(value: unknown, key: string): unknown[] {
  return asArray(asRecord(value)[key]);
}

/** Return the value when it is a string, else `undefined`. */
export function str(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/** Strip HTML tags from a string value and cap its length. */
export function stripHtml(value: unknown, max = 4000): string {
  return (str(value) ?? '').replace(/<[^>]+>/g, ' ').slice(0, max);
}

/** Truncate a string value to `max` characters (empty string if absent). */
export function clip(value: unknown, max = 4000): string {
  return (str(value) ?? '').slice(0, max);
}

/** Convert a numeric or string timestamp to ISO 8601, or `undefined` if invalid. */
export function toIso(value: unknown): string | undefined {
  if (typeof value !== 'number' && typeof value !== 'string') return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}
