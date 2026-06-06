/**
 * Text normalisation primitives shared by the matching and filtering stages.
 *
 * These functions are the foundation of every title/keyword comparison in the
 * engine, so they are deliberately small, pure and total — any input type is
 * coerced safely rather than throwing.
 */

/** Primitive inputs the normaliser accepts; anything falsy collapses to "". */
export type Normalizable = string | number | boolean | null | undefined;

/**
 * Lower-case a value and reduce it to a clean, space-separated token stream:
 * `&` becomes `and`, common separators collapse to spaces, anything that is not
 * a letter/digit/`#`/space is dropped, and runs of whitespace are squeezed.
 *
 * `#` is preserved so tokens like `c#` survive normalisation.
 */
export function normalizeText(value: Normalizable): string {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[._+/()-]/g, ' ')
    .replace(/[^a-z0-9#\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalise a job title and strip seniority/qualifier noise words so that two
 * titles can be compared on their core role. For example
 * `"Junior Backend Engineer II"` reduces to `"backend engineer"`.
 */
export function stripTitleNoise(value: Normalizable): string {
  return normalizeText(value)
    .replace(
      /\b(junior|jr|associate|graduate|entry level|early career|new grad|trainee|apprentice|remote|contract|freelance|i|ii)\b/g,
      ' ',
    )
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Whole-phrase containment check on normalised text. The phrase must appear as
 * a complete space-delimited run, so `"go"` matches `"go developer"` but not
 * `"good"`. An empty phrase never matches.
 */
export function containsPhrase(haystack: Normalizable, phrase: Normalizable): boolean {
  const hay = ` ${normalizeText(haystack)} `;
  const needle = normalizeText(phrase);
  return needle.length > 0 && hay.includes(` ${needle} `);
}
