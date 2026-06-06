import { resolveSelectedDomains } from '../domains/resolve.js';
import { planSources, locationName, type SourceKeys } from '../sources/plan.js';
import { runSources } from '../sources/run.js';
import { validateRawJobs } from '../sources/validate.js';
import { assembleJobs } from './assemble.js';
import { enrichJobs, type EnrichedJob } from '../enrich/enrich.js';
import { rankJobs, type Ranked } from '../rank/rank.js';
import type { HttpClient } from '../net/retry.js';
import type { VerifyClient } from '../enrich/verify.js';

/** Everything `scan` needs: what to search, how, and the injected transports. */
export interface ScanConfig {
  readonly domain: string | null | undefined;
  readonly country: string;
  readonly topN: number;
  /** ISO timestamp for deterministic posted-at/discovered-at fallbacks. */
  readonly now: string;
  readonly keys?: SourceKeys;
  readonly telegramChatId?: string;
  readonly blocklist?: readonly string[];

  readonly sourceClient: HttpClient;
  readonly verifyClient: VerifyClient;

  readonly sourceConcurrency?: number;
  readonly verifyConcurrency?: number;
  readonly retries?: number;
  readonly sourceTimeoutMs?: number;
  readonly verifyTimeoutMs?: number;
  readonly retryBaseMs?: number;
  readonly maxCompanyBoardsPerSource?: number;
  readonly verifyCompanyLinks?: boolean;
  readonly companyLinkVerifyLimit?: number;
  readonly sleep?: (ms: number) => Promise<void>;
  readonly rand?: () => number;
}

/** The outcome of a scan: the ranked jobs plus run diagnostics. */
export interface ScanResult {
  readonly ranked: Ranked<EnrichedJob>[];
  readonly selectedDomains: string[];
  readonly candidateCount: number;
  readonly quarantinedCount: number;
  readonly matchedCount: number;
  readonly debug: string[];
}

/**
 * Run a full discovery scan end to end: resolve the domain, plan and run the
 * sources, validate (quarantining malformed rows), assemble and match, verify
 * and enrich, then rank the top N. Both HTTP transports are injected, so the
 * same engine drives the CLI (real fetch), n8n (its httpRequest) and tests
 * (mocks).
 */
export async function scan(config: ScanConfig): Promise<ScanResult> {
  const domains = resolveSelectedDomains(config.domain);
  const timing = config.sleep ? { sleep: config.sleep } : {};
  const jitter = config.rand ? { rand: config.rand } : {};

  const requests = planSources(domains, config.country, {
    ...(config.keys ? { keys: config.keys } : {}),
    maxCompanyBoardsPerSource: config.maxCompanyBoardsPerSource ?? 0,
  });

  const { candidates, debug } = await runSources(requests, {
    client: config.sourceClient,
    concurrency: config.sourceConcurrency ?? 8,
    retries: config.retries ?? 2,
    timeoutMs: config.sourceTimeoutMs ?? 30000,
    retryBaseMs: config.retryBaseMs ?? 750,
    ...timing,
    ...jitter,
  });

  const { valid, quarantined } = validateRawJobs(candidates);

  const assembled = assembleJobs(valid, {
    selectedDomains: domains,
    country: config.country,
    defaultLocation: locationName(config.country),
    ...(config.telegramChatId ? { telegramChatId: config.telegramChatId } : {}),
    ...(config.blocklist ? { blocklist: config.blocklist } : {}),
    now: config.now,
  });

  const enriched = await enrichJobs(assembled, {
    verify: {
      client: config.verifyClient,
      retries: config.retries ?? 2,
      timeoutMs: config.verifyTimeoutMs ?? 15000,
      retryBaseMs: config.retryBaseMs ?? 600,
      ...timing,
      ...jitter,
    },
    concurrency: config.verifyConcurrency ?? 6,
    verifyCompanyLinks: config.verifyCompanyLinks ?? true,
    companyLinkVerifyLimit: config.companyLinkVerifyLimit ?? 60,
    now: config.now,
  });

  return {
    ranked: rankJobs(enriched, config.topN),
    selectedDomains: domains.map((d) => d.label),
    candidateCount: candidates.length,
    quarantinedCount: quarantined.length,
    matchedCount: assembled.length,
    debug,
  };
}
