import { describe, it, expect } from 'vitest';
import { parseDebugEntry, buildRunReport } from '../../src/delivery/report.js';
import type { ScanResult } from '../../src/pipeline/scan.js';

describe('parseDebugEntry', () => {
  it.each([
    ['gh:stripe:3', { name: 'gh:stripe', status: 'ok', count: 3 }],
    ['gh:stripe:0', { name: 'gh:stripe', status: 'empty', count: 0 }],
    ['gh:stripe:ERR:500:a3', { name: 'gh:stripe', status: 'error', count: 0 }],
    ['adzuna:AI:p1:parse-err', { name: 'adzuna:AI:p1', status: 'error', count: 0 }],
    ['remoteok:12', { name: 'remoteok', status: 'ok', count: 12 }],
  ])('parses %s', (entry, expected) => {
    expect(parseDebugEntry(entry)).toEqual(expected);
  });
});

describe('buildRunReport', () => {
  const result: ScanResult = {
    ranked: [],
    selectedDomains: ['AI, Machine Learning and GenAI'],
    candidateCount: 100,
    quarantinedCount: 2,
    matchedCount: 8,
    debug: ['gh:stripe:3', 'gh:openai:0', 'lever:netflix:ERR:503:a2', 'remoteok:5'],
  };

  it('aggregates per-source outcomes and counts', () => {
    const report = buildRunReport(result, 'IE');
    expect(report.country).toBe('IE');
    expect(report.candidates).toBe(100);
    expect(report.matched).toBe(8);
    expect(report.quarantined).toBe(2);
    expect(report.sources).toEqual({ total: 4, ok: 2, empty: 1, error: 1 });
    expect(report.sourceStats).toHaveLength(4);
  });
});
