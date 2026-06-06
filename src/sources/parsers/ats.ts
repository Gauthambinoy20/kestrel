import {
  type RawJobCandidate,
  arrayAt,
  asArray,
  asRecord,
  str,
  stripHtml,
  clip,
  toIso,
} from '../parse-helpers.js';

/**
 * Parse a Greenhouse board response (`/v1/boards/{company}/jobs?content=true`).
 * The company name comes from the board slug, not the payload. Job descriptions
 * arrive as HTML and are stripped.
 */
export function parseGreenhouse(data: unknown, company: string): RawJobCandidate[] {
  return arrayAt(data, 'jobs').map((item) => {
    const job = asRecord(item);
    return {
      source: `gh:${company}`,
      title: str(job.title),
      company,
      location: str(asRecord(job.location).name),
      url: str(job.absolute_url),
      jd_text: stripHtml(job.content),
      posted_at: str(job.updated_at),
      raw: item,
    };
  });
}

/**
 * Parse a Lever postings response (`/v0/postings/{company}?mode=json`), which
 * is a top-level array. `createdAt` is a millisecond epoch and is converted to
 * ISO; descriptions arrive as plain text.
 */
export function parseLever(data: unknown, company: string): RawJobCandidate[] {
  return asArray(data).map((item) => {
    const job = asRecord(item);
    return {
      source: `lever:${company}`,
      title: str(job.text),
      company,
      location: str(asRecord(job.categories).location),
      url: str(job.hostedUrl),
      jd_text: clip(job.descriptionPlain),
      posted_at: toIso(job.createdAt),
      raw: item,
    };
  });
}

/**
 * Parse an Ashby job-board response (`/posting-api/job-board/{company}`). The
 * location and apply URL each have a primary and fallback field.
 */
export function parseAshby(data: unknown, company: string): RawJobCandidate[] {
  return arrayAt(data, 'jobs').map((item) => {
    const job = asRecord(item);
    return {
      source: `ashby:${company}`,
      title: str(job.title),
      company,
      location: str(job.locationName) ?? str(job.location),
      url: str(job.jobUrl) ?? str(job.applyUrl),
      jd_text: clip(job.descriptionPlain),
      posted_at: str(job.publishedDate),
      raw: item,
    };
  });
}
