/** Escape the HTML-significant characters for Telegram HTML messages. */
export function escapeHtml(value: string | null | undefined): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** A ranked job as the digest renders it. */
export interface DigestJob {
  readonly rank: number;
  readonly score: number;
  readonly company?: string | undefined;
  readonly title?: string | undefined;
  readonly location?: string | undefined;
  readonly reason?: string | undefined;
  readonly link_status?: string | undefined;
  readonly apply_ready_score?: number | undefined;
  readonly source_quality?: string | undefined;
  readonly source?: string | undefined;
  readonly company_domain?: string | undefined;
  readonly crm_status?: string | undefined;
  readonly url?: string | undefined;
  readonly final_url?: string | undefined;
  readonly company_careers_url?: string | undefined;
}

/** Inputs for {@link buildDigest}. */
export interface DigestInput {
  readonly top: readonly DigestJob[];
  readonly domain: string;
  readonly country: string;
  /** Pre-formatted date string (injected for determinism). */
  readonly date: string;
}

/** The rendered digest in plain, Telegram-truncated and HTML forms. */
export interface Digest {
  readonly text: string;
  readonly telegramText: string;
  readonly telegramHtml: string;
}

const TELEGRAM_LIMIT = 3900;
const TELEGRAM_TRUNCATE_AT = 3860;

/**
 * Render a ranked job list into a digest. Each entry shows its rank, score,
 * company/title, location and reason, link status and apply-readiness, source
 * quality, optional company domain/CRM status, the apply link (resolved final
 * URL preferred), and an optional careers link. The Telegram form is truncated
 * to stay within message limits.
 */
export function buildDigest(input: DigestInput): Digest {
  const { top } = input;
  const lines: string[] = [`TOP ${top.length} - ${input.domain} - ${input.country} - ${input.date}`, ''];

  for (const job of top) {
    const link = job.final_url || job.url || '';
    const linkStatus = job.link_status ?? 'unchecked';
    const ready = Number.isFinite(Number(job.apply_ready_score)) ? Number(job.apply_ready_score) : 0;
    lines.push(`${job.rank}. [${job.score}] ${job.company ?? 'Unknown'} - ${job.title ?? ''}`);
    lines.push(`   ${job.location || '-'} | ${job.reason || 'ranked match'}`);
    lines.push(`   ${linkStatus} | ready ${ready}/100 | ${job.source_quality || job.source || 'unknown source'}`);
    if (job.company_domain) lines.push(`   ${job.company_domain} | ${job.crm_status ?? 'ready_to_review'}`);
    lines.push(`   Apply: ${link}`);
    if (job.company_careers_url) lines.push(`   Careers: ${job.company_careers_url}`);
    lines.push('');
  }

  const text = lines.join('\n');
  const telegramText =
    text.length > TELEGRAM_LIMIT
      ? `${text.slice(0, TELEGRAM_TRUNCATE_AT)}\n\n...truncated for Telegram. Full ranked data is in the run output.`
      : text;

  return { text, telegramText, telegramHtml: escapeHtml(telegramText) };
}
