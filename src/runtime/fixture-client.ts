import type { HttpClient } from '../net/retry.js';
import type { VerifyClient } from '../enrich/verify.js';

/**
 * A recorded source response, matched to a request by URL substring. Fixtures
 * are a DEV/TEST convenience only — they are clearly synthetic and must never
 * be presented as real results (see the no-fake-data rule).
 */
export interface SourceFixture {
  /** Substring matched against the request URL. */
  readonly match: string;
  readonly body: unknown;
  readonly status?: number;
}

/** An offline source client that replays fixtures (no network). */
export function createFixtureSourceClient(fixtures: readonly SourceFixture[]): HttpClient {
  return (options) => {
    const fixture = fixtures.find((f) => options.url.includes(f.match));
    return Promise.resolve(
      fixture ? { statusCode: fixture.status ?? 200, body: fixture.body } : { statusCode: 200, body: [] },
    );
  };
}

/** An offline verify client that reports every link as live. */
export function createFixtureVerifyClient(): VerifyClient {
  return ({ url }) => Promise.resolve({ statusCode: 200, body: '', finalUrl: url });
}
