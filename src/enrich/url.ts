/** URL and company-name parsing used by the verify/enrich stage. */

/** A validated http(s) URL broken into the parts the enricher needs. */
export interface SafeUrl {
  readonly protocol: 'http:' | 'https:';
  readonly hostname: string;
  readonly href: string;
}

/**
 * Loose normaliser used for company-name handling: lower-case, expand `&`, and
 * keep letters, digits, whitespace, dots and hyphens (unlike the matching
 * normaliser, which strips dots/hyphens too).
 */
export function looseNormalize(value: string | null | undefined): string {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parse a string into a {@link SafeUrl}, or `null` if it is not a well-formed
 * http(s) URL. Strips any `user:pass@` prefix and the port from the hostname,
 * and rejects non-http(s) schemes — a deliberately strict, dependency-free
 * alternative to `new URL()` that never throws.
 */
export function safeUrl(value: string | null | undefined): SafeUrl | null {
  const raw = String(value || '').trim();
  const match = raw.match(/^(https?):\/\/([^/?#\s]+)([^\s]*)?$/i);
  if (!match) return null;

  const scheme = match[1]!.toLowerCase();
  if (scheme !== 'http' && scheme !== 'https') return null;
  const protocol: 'http:' | 'https:' = scheme === 'https' ? 'https:' : 'http:';

  const host = match[2]!.replace(/^[^@]+@/, '');
  const hostname = host.split(':')[0]!.toLowerCase();
  if (hostname.length === 0) return null;

  return { protocol, hostname, href: raw };
}

/** Two-part public suffixes we must keep intact when finding a base domain. */
const TWO_PART_TLDS = new Set(['co.uk', 'com.au', 'com.br', 'co.jp', 'co.in', 'com.sg', 'com.mx']);

/**
 * Reduce a hostname to its registrable base domain: drop a leading `www.`, and
 * keep the last two labels — or three when the suffix is a known two-part TLD
 * (`acme.co.uk` stays, `jobs.acme.co.uk` → `acme.co.uk`).
 */
export function baseDomain(hostname: string | null | undefined): string {
  const host = String(hostname || '')
    .toLowerCase()
    .replace(/^www\./, '');
  const parts = host.split('.').filter(Boolean);
  if (parts.length <= 2) return host;

  const lastTwo = parts.slice(-2).join('.');
  if (TWO_PART_TLDS.has(lastTwo) && parts.length >= 3) return parts.slice(-3).join('.');
  return parts.slice(-2).join('.');
}

const COMPANY_SUFFIX =
  /\b(inc|incorporated|ltd|limited|llc|plc|gmbh|sa|ag|bv|company|technologies|technology|software|labs|ai)\b/g;

/**
 * Reduce a company name to a compact slug for guessing its domain: strip common
 * corporate suffixes (Inc, Ltd, Technologies, …), then keep only `[a-z0-9-]`.
 * Falls back to the un-stripped slug if stripping leaves nothing (e.g. a
 * company literally named "AI").
 */
export function cleanCompanySlug(company: string | null | undefined): string {
  const compact = (s: string): string => s.replace(/\s+/g, '').replace(/[^a-z0-9-]/g, '');
  const normalized = looseNormalize(company);
  const stripped = compact(normalized.replace(COMPANY_SUFFIX, ' '));
  return stripped || compact(normalized);
}
