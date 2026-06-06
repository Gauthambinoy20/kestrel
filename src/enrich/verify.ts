import { isRetryableStatus, retryDelayMs } from '../net/retry.js';
import { safeUrl } from './url.js';

/** Response shape the verify client returns (final URL included for redirects). */
export interface VerifyHttpResponse {
  statusCode?: number;
  status?: number;
  body?: unknown;
  finalUrl?: string;
}

/** The injected transport for link checks (HEAD/GET). */
export type VerifyClient = (options: {
  url: string;
  method: 'HEAD' | 'GET';
  timeout: number;
}) => Promise<VerifyHttpResponse>;

/** Configuration for {@link verifyJobUrl}. */
export interface VerifyConfig {
  client: VerifyClient;
  retries: number;
  timeoutMs: number;
  retryBaseMs: number;
  sleep?: (ms: number) => Promise<void>;
  rand?: () => number;
}

/** The outcome of verifying a job link. */
export interface LinkStatus {
  link_ok: boolean;
  link_status: string;
  link_status_code: number;
  final_url: string;
  link_error: string;
  link_attempts: number;
  link_check_method: string;
}

interface AttemptResult {
  ok: boolean;
  statusCode: number;
  body: string;
  finalUrl: string;
  attempts: number;
  method: string;
  error: string;
}

const EXPIRED_RE = /job no longer|position has been filled|not found|no longer accepting|closed|expired/i;
const BODY_SNIPPET_CHARS = 1200;

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function request(
  url: string,
  method: 'HEAD' | 'GET',
  config: VerifyConfig,
): Promise<AttemptResult> {
  const sleep = config.sleep ?? defaultSleep;
  const rand = config.rand ?? Math.random;
  let lastError = '';
  let lastStatus = 0;

  for (let attempt = 1; attempt <= config.retries + 1; attempt++) {
    try {
      const res = await config.client({ url, method, timeout: config.timeoutMs });
      const statusCode = Number(res.statusCode ?? res.status ?? 0);
      lastStatus = statusCode;
      if (isRetryableStatus(statusCode) && attempt <= config.retries) {
        await sleep(retryDelayMs(attempt, config.retryBaseMs, rand));
        continue;
      }
      const body = typeof res.body === 'string' ? res.body.slice(0, BODY_SNIPPET_CHARS) : '';
      return {
        ok: true,
        statusCode,
        body,
        finalUrl: res.finalUrl ?? url,
        attempts: attempt,
        method,
        error: '',
      };
    } catch (err) {
      lastError = String(err).slice(0, 160);
      if (attempt <= config.retries) {
        await sleep(retryDelayMs(attempt, config.retryBaseMs, rand));
        continue;
      }
    }
  }

  return {
    ok: false,
    statusCode: lastStatus,
    body: '',
    finalUrl: url,
    attempts: config.retries + 1,
    method,
    error: lastError || `http_${lastStatus || 'error'}`,
  };
}

/**
 * Verify that a job URL is still live. Tries a cheap HEAD first and falls back
 * to GET when HEAD is unusable (failed, no status, or ≥ 400). A live 2xx/3xx
 * response whose body does not look like an expired/closed posting is "live";
 * everything else is reported with a specific status.
 */
export async function verifyJobUrl(
  url: string | null | undefined,
  config: VerifyConfig,
): Promise<LinkStatus> {
  const parsed = safeUrl(url);
  if (!parsed) {
    return {
      link_ok: false,
      link_status: 'invalid_url',
      link_status_code: 0,
      final_url: url ?? '',
      link_error: '',
      link_attempts: 0,
      link_check_method: '',
    };
  }

  let result = await request(parsed.href, 'HEAD', config);
  if (!result.ok || !result.statusCode || result.statusCode >= 400) {
    const getResult = await request(parsed.href, 'GET', config);
    if (getResult.ok || getResult.statusCode || getResult.body) result = getResult;
  }

  const expired = EXPIRED_RE.test(result.body);
  const linkOk = result.statusCode >= 200 && result.statusCode < 400 && !expired;
  return {
    link_ok: linkOk,
    link_status: linkOk
      ? 'live'
      : expired
        ? 'expired_or_closed'
        : `http_${result.statusCode || 'error'}`,
    link_status_code: result.statusCode || 0,
    final_url: result.finalUrl || parsed.href,
    link_error: result.error,
    link_attempts: result.attempts,
    link_check_method: result.method,
  };
}
