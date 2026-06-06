import {
  type RawJobCandidate,
  arrayAt,
  asArray,
  asRecord,
  str,
  stripHtml,
} from '../parse-helpers.js';

/**
 * Parse the RemoteOK API response. Its first array element is a legal/notice
 * object rather than a job, so it is dropped. Location defaults to "Remote".
 */
export function parseRemoteOk(data: unknown): RawJobCandidate[] {
  return asArray(data)
    .slice(1)
    .map((item) => {
      const job = asRecord(item);
      return {
        source: 'remoteok',
        title: str(job.position),
        company: str(job.company),
        location: str(job.location) ?? 'Remote',
        url: str(job.url),
        jd_text: stripHtml(job.description),
        posted_at: str(job.date),
        raw: item,
      };
    });
}

/**
 * Parse a ScrapeGraphAI extract response. Jobs live at `result.jobs` (preferred)
 * or `jobs`. The company is derived from the source label, e.g.
 * `sgai:google-careers` → `google`.
 */
export function parseScrapeGraphAi(data: unknown, sourceLabel: string): RawJobCandidate[] {
  const root = asRecord(data);
  const fromResult = arrayAt(root.result, 'jobs');
  const items = fromResult.length > 0 ? fromResult : arrayAt(root, 'jobs');
  const company = sourceLabel.split(':')[1]?.split('-')[0] ?? '';

  return items.map((item) => {
    const job = asRecord(item);
    return {
      source: sourceLabel,
      title: str(job.title),
      company,
      location: str(job.location),
      url: str(job.url),
      jd_text: str(job.department),
      raw: item,
    };
  });
}
