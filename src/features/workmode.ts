/** How a role is worked. */
export type WorkMode = 'remote' | 'hybrid' | 'onsite' | 'unknown';

/** The classified work mode plus the phrases that decided it. */
export interface WorkModeResult {
  readonly mode: WorkMode;
  readonly signals: string[];
}

const HYBRID = [/\bhybrid\b/i, /days? (a|per) week in (the )?office/i, /\d\s?days? in (the )?office/i];
const REMOTE = [/\bremote(-first| first| working)?\b/i, /work from home/i, /\bwfh\b/i, /fully remote/i];
const ONSITE = [/\bon-?site\b/i, /\bin[- ]office\b/i, /\bin[- ]person\b/i, /relocat/i];

function matched(text: string, patterns: readonly RegExp[]): string[] {
  const out: string[] = [];
  for (const re of patterns) {
    const m = re.exec(text);
    if (m) out.push(m[0].toLowerCase());
  }
  return out;
}

/**
 * Classify a role's work mode from its combined text. Hybrid wins when present
 * (it often co-mentions remote and office), then remote, then on-site;
 * otherwise unknown. Returns the matched phrases for transparency.
 */
export function detectWorkMode(text: string | null | undefined): WorkModeResult {
  const t = String(text || '');
  const hybrid = matched(t, HYBRID);
  if (hybrid.length > 0) return { mode: 'hybrid', signals: hybrid };
  const remote = matched(t, REMOTE);
  if (remote.length > 0) return { mode: 'remote', signals: remote };
  const onsite = matched(t, ONSITE);
  if (onsite.length > 0) return { mode: 'onsite', signals: onsite };
  return { mode: 'unknown', signals: [] };
}
