import type { EnrichedDomain } from '../domains/types.js';
import type { HttpRequestOptions } from '../net/retry.js';
import { COMPANY_BOARDS } from './boards.js';

/** The provider a request targets, which selects the parser for its response. */
export type SourceKind =
  | 'adzuna'
  | 'jooble'
  | 'greenhouse'
  | 'lever'
  | 'ashby'
  | 'remoteok'
  | 'sgai'
  | 'serpapi';

/** A planned source call: a label, its provider kind, and the HTTP request. */
export interface SourceRequest {
  readonly name: string;
  readonly kind: SourceKind;
  readonly options: HttpRequestOptions;
  /** Company slug for ATS board requests (greenhouse/lever/ashby). */
  readonly company?: string;
}

/** Optional API keys; a source is only planned when its key(s) are present. */
export interface SourceKeys {
  readonly adzunaId?: string;
  readonly adzunaKey?: string;
  readonly joobleKey?: string;
  readonly serpKey?: string;
  readonly sgaiKey?: string;
}

/** Configuration for {@link planSources}. */
export interface SourcePlanConfig {
  readonly keys?: SourceKeys;
  /** Cap public boards checked per provider (0 = all). */
  readonly maxCompanyBoardsPerSource?: number;
}

const ADZUNA_CC: Record<string, string> = { IE: 'gb', AE: 'gb', AU: 'au', US: 'us', UK: 'gb' };
const LOCATION_NAME: Record<string, string> = {
  IE: 'Ireland',
  AE: 'United Arab Emirates',
  AU: 'Australia',
  US: 'United States',
  UK: 'United Kingdom',
};

function boardList(list: readonly string[], cap: number): readonly string[] {
  const unique = [...new Set(list)];
  return cap > 0 ? unique.slice(0, cap) : unique;
}

/**
 * Plan the set of source HTTP requests for a scan. Keyless public ATS boards
 * and RemoteOK are always included; aggregator/AI sources are added only when
 * their API key is present. Search queries and page depth scale down when many
 * domains are selected to keep the request volume sane.
 */
export function planSources(
  domains: readonly EnrichedDomain[],
  country: string,
  config: SourcePlanConfig = {},
): SourceRequest[] {
  const keys = config.keys ?? {};
  const cap = config.maxCompanyBoardsPerSource ?? 0;
  const multi = domains.length > 1;
  const apiPages = multi ? 1 : 2;
  const queries = [...new Set(domains.flatMap((d) => d.searchQueries).filter(Boolean))].slice(
    0,
    multi ? 6 : 5,
  );
  const cc = ADZUNA_CC[country] ?? 'gb';
  const loc = LOCATION_NAME[country] ?? 'Ireland';
  const requests: SourceRequest[] = [];

  if (keys.adzunaId && keys.adzunaKey) {
    for (const q of queries) {
      for (let p = 1; p <= apiPages; p++) {
        requests.push({
          name: `adzuna:${q}:p${p}`,
          kind: 'adzuna',
          options: {
            method: 'GET',
            url: `https://api.adzuna.com/v1/api/jobs/${cc}/search/${p}`,
            qs: {
              app_id: keys.adzunaId,
              app_key: keys.adzunaKey,
              results_per_page: 50,
              what: q,
              where: loc,
              max_days_old: 14,
            },
          },
        });
      }
    }
  }

  if (keys.joobleKey) {
    for (const q of queries) {
      for (let p = 1; p <= apiPages; p++) {
        requests.push({
          name: `jooble:${q}:p${p}`,
          kind: 'jooble',
          options: {
            method: 'POST',
            url: `https://jooble.org/api/${keys.joobleKey}`,
            headers: { 'Content-Type': 'application/json' },
            body: { keywords: q, location: loc, page: String(p) },
          },
        });
      }
    }
  }

  for (const b of boardList(COMPANY_BOARDS.greenhouse, cap)) {
    requests.push({
      name: `gh:${b}`,
      kind: 'greenhouse',
      company: b,
      options: { method: 'GET', url: `https://boards-api.greenhouse.io/v1/boards/${b}/jobs?content=true` },
    });
  }
  for (const c of boardList(COMPANY_BOARDS.lever, cap)) {
    requests.push({
      name: `lever:${c}`,
      kind: 'lever',
      company: c,
      options: { method: 'GET', url: `https://api.lever.co/v0/postings/${c}?mode=json` },
    });
  }
  for (const c of boardList(COMPANY_BOARDS.ashby, cap)) {
    requests.push({
      name: `ashby:${c}`,
      kind: 'ashby',
      company: c,
      options: {
        method: 'GET',
        url: `https://api.ashbyhq.com/posting-api/job-board/${c}?includeCompensation=true`,
      },
    });
  }

  requests.push({
    name: 'remoteok',
    kind: 'remoteok',
    options: { method: 'GET', url: 'https://remoteok.com/api', headers: { 'User-Agent': 'kestrel/1.0' } },
  });

  if (keys.sgaiKey) {
    const q = queries[0] ?? '';
    const targets: Array<{ name: string; url: string }> = [
      {
        name: 'sgai:google-careers',
        url: `https://www.google.com/about/careers/applications/jobs/results/?q=${encodeURIComponent(q)}&location=${encodeURIComponent(loc)}`,
      },
      {
        name: 'sgai:apple-careers',
        url: `https://jobs.apple.com/en-us/search?search=${encodeURIComponent(q)}&sort=relevance`,
      },
      { name: 'sgai:meta-careers', url: `https://www.metacareers.com/jobs?q=${encodeURIComponent(q)}` },
    ];
    for (const t of targets) {
      requests.push({
        name: t.name,
        kind: 'sgai',
        options: {
          method: 'POST',
          url: 'https://v2-api.scrapegraphai.com/api/extract',
          headers: { 'SGAI-APIKEY': keys.sgaiKey, 'Content-Type': 'application/json' },
          body: {
            url: t.url,
            prompt:
              'Extract every job posting visible on this page. Return strict JSON: {"jobs":[{"title":"","location":"","url":"","department":""}]}. Include up to 50 jobs.',
          },
        },
      });
    }
  }

  if (keys.serpKey) {
    for (const q of queries.slice(0, 3)) {
      requests.push({
        name: `serpapi:${q}`,
        kind: 'serpapi',
        options: {
          method: 'GET',
          url: 'https://serpapi.com/search.json',
          qs: { engine: 'google_jobs', q: `${q} ${loc}`, hl: 'en', api_key: keys.serpKey },
        },
      });
    }
  }

  return requests;
}
