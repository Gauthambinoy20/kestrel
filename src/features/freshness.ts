/** How recent a posting is, with a score-decay multiplier. */
export interface Freshness {
  /** Whole days since the job was posted, or null if the date is unknown. */
  readonly ageDays: number | null;
  /** True when within the "fresh" window. */
  readonly isFresh: boolean;
  /** Multiplier in [0,1] that decays linearly with age (1 = brand new / unknown). */
  readonly decay: number;
}

/** Options for {@link computeFreshness}. */
export interface FreshnessOptions {
  /** Posts within this many days are "fresh". Default 7. */
  readonly freshDays?: number;
  /** Age at which decay reaches 0. Default 30. */
  readonly maxDays?: number;
}

const MS_PER_DAY = 86_400_000;

/**
 * Compute a posting's age and a freshness-decay multiplier. The multiplier
 * falls linearly from 1 (today) to 0 (at maxDays) and is used to gently
 * down-weight stale postings in ranking. An unknown/invalid date is treated as
 * neutral (decay 1) so we never penalise a job for missing metadata; a future
 * date is clamped to age 0.
 */
export function computeFreshness(
  postedAt: string | null | undefined,
  nowIso: string,
  options: FreshnessOptions = {},
): Freshness {
  const freshDays = options.freshDays ?? 7;
  const maxDays = options.maxDays ?? 30;

  const posted = new Date(postedAt ?? '').getTime();
  const now = new Date(nowIso).getTime();
  if (Number.isNaN(posted) || Number.isNaN(now)) {
    return { ageDays: null, isFresh: false, decay: 1 };
  }

  const ageDays = Math.max(0, Math.floor((now - posted) / MS_PER_DAY));
  const decay = Math.max(0, Math.min(1, 1 - ageDays / maxDays));
  return { ageDays, isFresh: ageDays <= freshDays, decay };
}
