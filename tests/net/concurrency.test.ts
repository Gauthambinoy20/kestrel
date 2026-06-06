import { describe, it, expect } from 'vitest';
import { runLimited } from '../../src/net/concurrency.js';

const defer = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve };
};

describe('runLimited', () => {
  it('returns an empty array for no tasks', async () => {
    expect(await runLimited([], 4)).toEqual([]);
  });

  it('runs every task and preserves input order', async () => {
    const tasks = [10, 20, 30, 40].map((n) => () => Promise.resolve(n * 2));
    expect(await runLimited(tasks, 2)).toEqual([20, 40, 60, 80]);
  });

  it('never exceeds the concurrency limit', async () => {
    let active = 0;
    let peak = 0;
    const tasks = Array.from({ length: 10 }, () => async () => {
      active += 1;
      peak = Math.max(peak, active);
      await Promise.resolve();
      await Promise.resolve();
      active -= 1;
      return active;
    });
    await runLimited(tasks, 3);
    expect(peak).toBeLessThanOrEqual(3);
  });

  it('processes tasks with a limit of 1 sequentially', async () => {
    const order: number[] = [];
    const gate = defer();
    const tasks = [
      async () => {
        await gate.promise;
        order.push(1);
      },
      () => {
        order.push(2);
        return Promise.resolve();
      },
    ];
    const run = runLimited(tasks, 1);
    // With limit 1, task 2 cannot start until task 1 resolves.
    expect(order).toEqual([]);
    gate.resolve();
    await run;
    expect(order).toEqual([1, 2]);
  });

  it('handles a limit larger than the task count', async () => {
    const tasks = [1, 2].map((n) => () => Promise.resolve(n));
    expect(await runLimited(tasks, 99)).toEqual([1, 2]);
  });
});
