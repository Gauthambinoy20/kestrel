/** A set of job hashes seen on previous runs, for cross-run de-duplication. */
export interface SeenStore {
  has(hash: string): boolean;
  add(hash: string): void;
  /** All remembered hashes, for persistence. */
  values(): string[];
  size(): number;
}

/** Create an in-memory seen-store, optionally seeded from prior hashes. */
export function createSeenStore(initial: Iterable<string> = []): SeenStore {
  const set = new Set(initial);
  return {
    has: (hash) => set.has(hash),
    add: (hash) => {
      set.add(hash);
    },
    values: () => [...set],
    size: () => set.size,
  };
}

/** Split jobs into those not seen before and those already seen. Pure. */
export function partitionUnseen<T extends { hash: string }>(
  jobs: readonly T[],
  store: SeenStore,
): { fresh: T[]; seen: T[] } {
  const fresh: T[] = [];
  const seen: T[] = [];
  for (const job of jobs) {
    if (store.has(job.hash)) seen.push(job);
    else fresh.push(job);
  }
  return { fresh, seen };
}

/** Record every job's hash in the store (so future runs treat them as seen). */
export function rememberAll(jobs: readonly { hash: string }[], store: SeenStore): void {
  for (const job of jobs) store.add(job.hash);
}
