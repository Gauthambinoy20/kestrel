import {
  type RawJobCandidate,
  arrayAt,
  asArray,
  asRecord,
  str,
  clip,
} from '../parse-helpers.js';

/** Parse an Adzuna search response (`results` array, nested company/location). */
export function parseAdzuna(data: unknown): RawJobCandidate[] {
  return arrayAt(data, 'results').map((item) => {
    const job = asRecord(item);
    return {
      source: 'adzuna',
      title: str(job.title),
      company: str(asRecord(job.company).display_name),
      location: str(asRecord(job.location).display_name),
      url: str(job.redirect_url),
      jd_text: str(job.description),
      posted_at: str(job.created),
      raw: item,
    };
  });
}

/** Parse a Jooble API response (`jobs` array, flat fields). */
export function parseJooble(data: unknown): RawJobCandidate[] {
  return arrayAt(data, 'jobs').map((item) => {
    const job = asRecord(item);
    return {
      source: 'jooble',
      title: str(job.title),
      company: str(job.company),
      location: str(job.location),
      url: str(job.link),
      jd_text: str(job.snippet),
      posted_at: str(job.updated),
      raw: item,
    };
  });
}

/**
 * Parse a SerpAPI Google Jobs response (`jobs_results` array). The apply URL is
 * the first related link, falling back to the shareable link.
 */
export function parseSerpApi(data: unknown): RawJobCandidate[] {
  return arrayAt(data, 'jobs_results').map((item) => {
    const job = asRecord(item);
    const firstRelated = asRecord(asArray(job.related_links)[0]);
    return {
      source: 'serpapi',
      title: str(job.title),
      company: str(job.company_name),
      location: str(job.location),
      url: str(firstRelated.link) ?? str(job.share_link),
      jd_text: clip(job.description),
      raw: item,
    };
  });
}
