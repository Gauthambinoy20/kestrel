/** Characters Telegram's MarkdownV2 requires to be backslash-escaped. */
const MARKDOWN_V2_SPECIALS = /[_*[\]()~`>#+\-=|{}.!\\]/g;

/** Escape text for Telegram MarkdownV2 so user content can't break formatting. */
export function escapeMarkdownV2(value: string | null | undefined): string {
  return String(value || '').replace(MARKDOWN_V2_SPECIALS, (ch) => `\\${ch}`);
}

const TELEGRAM_MAX = 4096;

/**
 * Split a message into Telegram-sized chunks (default 4096 chars). Splitting
 * prefers line boundaries so entries stay intact; a single line longer than the
 * limit is hard-split. Unlike the v1 digest, nothing is truncated — every line
 * is delivered across as many messages as needed.
 */
export function chunkMessage(text: string, limit: number = TELEGRAM_MAX): string[] {
  if (text.length <= limit) return text.length === 0 ? [] : [text];

  const chunks: string[] = [];
  let current = '';

  const flush = (): void => {
    if (current.length > 0) {
      chunks.push(current);
      current = '';
    }
  };

  for (const line of text.split('\n')) {
    if (line.length > limit) {
      flush();
      for (let i = 0; i < line.length; i += limit) chunks.push(line.slice(i, i + limit));
      continue;
    }
    const candidate = current.length === 0 ? line : `${current}\n${line}`;
    if (candidate.length > limit) {
      flush();
      current = line;
    } else {
      current = candidate;
    }
  }
  flush();
  return chunks;
}
