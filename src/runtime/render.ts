import { buildDigest } from '../delivery/digest.js';
import type { ScanResult } from '../pipeline/scan.js';

/** Options controlling how a scan result is rendered for the terminal. */
export interface RenderOptions {
  readonly json: boolean;
  readonly country: string;
  readonly date: string;
}

/** Render a scan result as either pretty JSON or a human-readable digest. */
export function renderResult(result: ScanResult, opts: RenderOptions): string {
  if (opts.json) return JSON.stringify(result, null, 2);
  return buildDigest({
    top: result.ranked,
    domain: result.selectedDomains.join(', ') || 'all',
    country: opts.country,
    date: opts.date,
  }).text;
}

/** A one-line run summary for stderr (counts of the pipeline stages). */
export function renderSummary(result: ScanResult): string {
  return `${result.ranked.length} ranked · ${result.matchedCount} matched · ${result.quarantinedCount} quarantined · ${result.candidateCount} candidates · ${result.debug.length} sources`;
}
