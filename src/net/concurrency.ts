/**
 * Run async tasks with a bounded number in flight at once, preserving result
 * order. A fixed pool of workers pulls tasks from a shared cursor until the
 * queue drains — so 200 board lookups can run 8-at-a-time without spawning 200
 * simultaneous requests.
 */
export async function runLimited<T>(
  tasks: ReadonlyArray<() => Promise<T>>,
  limit: number,
): Promise<T[]> {
  const out = new Array<T>(tasks.length);
  let cursor = 0;

  const worker = async (): Promise<void> => {
    while (cursor < tasks.length) {
      const index = cursor++;
      out[index] = await tasks[index]!();
    }
  };

  const poolSize = Math.max(1, Math.min(Math.floor(limit) || 1, tasks.length || 1));
  await Promise.all(Array.from({ length: poolSize }, () => worker()));
  return out;
}
