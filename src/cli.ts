#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { Command } from 'commander';
import { scan } from './pipeline/scan.js';
import { createFetchClient, createVerifyClient } from './runtime/fetch-client.js';
import {
  createFixtureSourceClient,
  createFixtureVerifyClient,
  type SourceFixture,
} from './runtime/fixture-client.js';
import { renderResult, renderSummary } from './runtime/render.js';
import type { HttpClient } from './net/retry.js';
import type { VerifyClient } from './enrich/verify.js';
import type { SourceKeys } from './sources/plan.js';
import { VERSION } from './version.js';

interface ScanOptions {
  domain: string;
  country: string;
  top: string;
  maxBoards: string;
  json?: boolean;
  verifyCompanyLinks: boolean;
  offline?: string;
}

/** Read optional source API keys from the environment (omitting absent ones). */
function readKeys(): SourceKeys {
  const env = process.env;
  const sgai = env.SCRAPEGRAPHAI_KEY ?? env.SGAI_API_KEY;
  return {
    ...(env.ADZUNA_APP_ID ? { adzunaId: env.ADZUNA_APP_ID } : {}),
    ...(env.ADZUNA_APP_KEY ? { adzunaKey: env.ADZUNA_APP_KEY } : {}),
    ...(env.JOOBLE_KEY ? { joobleKey: env.JOOBLE_KEY } : {}),
    ...(env.SERPAPI_KEY ? { serpKey: env.SERPAPI_KEY } : {}),
    ...(sgai ? { sgaiKey: sgai } : {}),
  };
}

const program = new Command();
program.name('kestrel').description('Multi-source job-discovery engine').version(VERSION);

program
  .command('scan')
  .description('Scan sources for matching jobs and print a ranked digest')
  .option('-d, --domain <domain>', 'IT domain to search', 'ai')
  .option('-c, --country <code>', 'country code (IE/UK/US/AU/AE)', 'IE')
  .option('-t, --top <n>', 'number of results', '10')
  .option('--max-boards <n>', 'cap ATS boards per provider (0 = all)', '0')
  .option('--json', 'output JSON instead of a digest')
  .option('--no-verify-company-links', 'skip public company-page checks')
  .option('--offline <file>', 'replay recorded fixtures, no network (dev/test only)')
  .action(async (options: ScanOptions) => {
    let sourceClient: HttpClient;
    let verifyClient: VerifyClient;
    if (options.offline) {
      const fixtures = JSON.parse(readFileSync(options.offline, 'utf8')) as SourceFixture[];
      sourceClient = createFixtureSourceClient(fixtures);
      verifyClient = createFixtureVerifyClient();
    } else {
      sourceClient = createFetchClient();
      verifyClient = createVerifyClient();
    }
    const result = await scan({
      domain: options.domain,
      country: options.country,
      topN: Number(options.top),
      now: new Date().toISOString(),
      keys: readKeys(),
      sourceClient,
      verifyClient,
      maxCompanyBoardsPerSource: Number(options.maxBoards),
      verifyCompanyLinks: options.verifyCompanyLinks,
    });
    const date = new Date().toISOString().slice(0, 10);
    process.stdout.write(
      `${renderResult(result, { json: Boolean(options.json), country: options.country, date })}\n`,
    );
    process.stderr.write(`\n${renderSummary(result)}\n`);
  });

void program.parseAsync(process.argv).catch((err: unknown) => {
  process.stderr.write(`kestrel: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exitCode = 1;
});
