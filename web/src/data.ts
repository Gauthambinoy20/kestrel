import type { ScanResult } from './types.js';

/**
 * Load a scan result produced by the engine CLI (`kestrel scan --json > scan.json`).
 * The dashboard shows REAL engine output only — there is no bundled sample data.
 * A missing file surfaces an honest empty/error state rather than fabricated jobs.
 */
export async function loadScan(url = '/scan.json'): Promise<ScanResult> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load scan data (${String(res.status)})`);
  return (await res.json()) as ScanResult;
}
