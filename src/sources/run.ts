import { runLimited } from '../net/concurrency.js';
import { safeRequest, type HttpClient } from '../net/retry.js';
import type { SourceRequest } from './plan.js';
import type { RawJobCandidate } from './parse-helpers.js';
import { parseGreenhouse, parseLever, parseAshby } from './parsers/ats.js';
import { parseAdzuna, parseJooble, parseSerpApi } from './parsers/aggregators.js';
import { parseRemoteOk, parseScrapeGraphAi } from './parsers/misc.js';

/** Runtime configuration for {@link runSources}. */
export interface RunSourcesConfig {
  readonly client: HttpClient;
  readonly concurrency: number;
  readonly retries: number;
  readonly timeoutMs: number;
  readonly retryBaseMs: number;
  readonly sleep?: (ms: number) => Promise<void>;
  readonly rand?: () => number;
}

/** Output of a source run: raw candidates plus a per-source debug trace. */
export interface RunSourcesResult {
  readonly candidates: RawJobCandidate[];
  /** One entry per source: `name:count`, `name:ERR:status:aN`, or `name:parse-err`. */
  readonly debug: string[];
}

function parseResponse(request: SourceRequest, data: unknown): RawJobCandidate[] {
  switch (request.kind) {
    case 'adzuna':
      return parseAdzuna(data);
    case 'jooble':
      return parseJooble(data);
    case 'greenhouse':
      return parseGreenhouse(data, request.company ?? '');
    case 'lever':
      return parseLever(data, request.company ?? '');
    case 'ashby':
      return parseAshby(data, request.company ?? '');
    case 'remoteok':
      return parseRemoteOk(data);
    case 'sgai':
      return parseScrapeGraphAi(data, request.name);
    case 'serpapi':
      return parseSerpApi(data);
  }
}

/**
 * Execute planned source requests with bounded concurrency, parse each
 * response into raw candidates, and record a per-source debug trace. A failed
 * source is logged and skipped (never thrown); a parser error is isolated to
 * its source. Candidates are not pre-filtered — the validation gate downstream
 * quarantines malformed ones so nothing is silently dropped.
 */
export async function runSources(
  requests: readonly SourceRequest[],
  config: RunSourcesConfig,
): Promise<RunSourcesResult> {
  const requestConfig = {
    client: config.client,
    retries: config.retries,
    timeoutMs: config.timeoutMs,
    retryBaseMs: config.retryBaseMs,
    ...(config.sleep ? { sleep: config.sleep } : {}),
    ...(config.rand ? { rand: config.rand } : {}),
  };

  const tasks = requests.map((request) => async () => ({
    request,
    result: await safeRequest(request.name, request.options, requestConfig),
  }));

  const settled = await runLimited(tasks, config.concurrency);
  const candidates: RawJobCandidate[] = [];
  const debug: string[] = [];

  for (const { request, result } of settled) {
    if (!result.ok) {
      debug.push(`${result.source}:ERR:${result.status || 'no_status'}:a${result.attempts}`);
      continue;
    }
    try {
      const parsed = parseResponse(request, result.data);
      debug.push(`${result.source}:${parsed.length}`);
      candidates.push(...parsed);
    } catch {
      debug.push(`${result.source}:parse-err`);
    }
  }

  return { candidates, debug };
}
