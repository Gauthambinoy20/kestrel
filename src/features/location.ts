/** A job location reduced to canonical parts. */
export interface NormalizedLocation {
  readonly raw: string;
  readonly city: string | null;
  readonly country: string | null;
  readonly remote: boolean;
}

const COUNTRY_PATTERNS: Array<[RegExp, string]> = [
  [/\b(ireland|ie|dublin|cork|galway|limerick)\b/i, 'IE'],
  [/\b(united kingdom|uk|gb|england|london|manchester|edinburgh|scotland)\b/i, 'UK'],
  [/\b(united states|usa|us|new york|san francisco|seattle|austin|boston|chicago)\b/i, 'US'],
  [/\b(australia|au|sydney|melbourne)\b/i, 'AU'],
  [/\b(united arab emirates|uae|dubai|abu dhabi)\b/i, 'AE'],
];

/**
 * Normalise a free-text location: detect a country (from country names/codes or
 * major cities), flag remote roles, and pull a cleaned city from the first
 * segment. Best-effort — unknown locations keep the city and leave country null
 * rather than guessing.
 */
export function normalizeLocation(raw: string | null | undefined): NormalizedLocation {
  const text = String(raw || '').trim();
  if (text.length === 0) return { raw: '', city: null, country: null, remote: false };

  const remote = /\bremote\b|work from home|\bwfh\b|anywhere/i.test(text);

  let country: string | null = null;
  for (const [re, code] of COUNTRY_PATTERNS) {
    if (re.test(text)) {
      country = code;
      break;
    }
  }

  const firstSegment = text.split(/[,/|–-]/)[0]!.trim();
  const city = /remote|anywhere|^eu$|^emea$/i.test(firstSegment) || firstSegment.length === 0
    ? null
    : firstSegment;

  return { raw: text, city, country, remote };
}
