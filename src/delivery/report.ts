import type { ScanResult } from '../pipeline/scan.js';

/** Per-source outcome parsed from the scan debug trace. */
export interface SourceStat {
  readonly name: string;
  readonly status: 'ok' | 'empty' | 'error';
  readonly count: number;
}

/** A structured summary of a scan run. */
export interface RunReport {
  readonly domains: string[];
  readonly country: string;
  readonly candidates: number;
  readonly matched: number;
  readonly quarantined: number;
  readonly ranked: number;
  readonly sources: { total: number; ok: number; empty: number; error: number };
  readonly sourceStats: SourceStat[];
}

/** Parse one debug entry (`name:count`, `name:ERR:...`, `name:parse-err`). */
export function parseDebugEntry(entry: string): SourceStat {
  const errIndex = entry.indexOf(':ERR:');
  if (errIndex >= 0) return { name: entry.slice(0, errIndex), status: 'error', count: 0 };
  if (entry.endsWith(':parse-err')) {
    return { name: entry.slice(0, -':parse-err'.length), status: 'error', count: 0 };
  }
  const lastColon = entry.lastIndexOf(':');
  const name = lastColon >= 0 ? entry.slice(0, lastColon) : entry;
  const count = Number(entry.slice(lastColon + 1));
  if (!Number.isFinite(count)) return { name: entry, status: 'error', count: 0 };
  return { name, status: count > 0 ? 'ok' : 'empty', count };
}

/**
 * Build a structured run report from a scan result: domain/country, the
 * pipeline counts, and per-source outcomes aggregated into ok/empty/error
 * tallies — the observability view of a run.
 */
export function buildRunReport(result: ScanResult, country: string): RunReport {
  const sourceStats = result.debug.map(parseDebugEntry);
  const sources = {
    total: sourceStats.length,
    ok: sourceStats.filter((s) => s.status === 'ok').length,
    empty: sourceStats.filter((s) => s.status === 'empty').length,
    error: sourceStats.filter((s) => s.status === 'error').length,
  };
  return {
    domains: result.selectedDomains,
    country,
    candidates: result.candidateCount,
    matched: result.matchedCount,
    quarantined: result.quarantinedCount,
    ranked: result.ranked.length,
    sources,
    sourceStats,
  };
}
