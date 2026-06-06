import { describe, it, expect } from 'vitest';
import {
  createSeenStore,
  partitionUnseen,
  rememberAll,
} from '../../src/features/seen-store.js';

describe('createSeenStore', () => {
  it('seeds from initial hashes and reports membership', () => {
    const store = createSeenStore(['a', 'b']);
    expect(store.has('a')).toBe(true);
    expect(store.has('c')).toBe(false);
    expect(store.size()).toBe(2);
  });

  it('adds hashes and exposes values for persistence', () => {
    const store = createSeenStore();
    store.add('x');
    store.add('x');
    expect(store.size()).toBe(1);
    expect(store.values()).toEqual(['x']);
  });
});

describe('partitionUnseen', () => {
  it('splits fresh from already-seen jobs', () => {
    const store = createSeenStore(['seen1']);
    const { fresh, seen } = partitionUnseen(
      [{ hash: 'seen1' }, { hash: 'new1' }, { hash: 'new2' }],
      store,
    );
    expect(fresh.map((j) => j.hash)).toEqual(['new1', 'new2']);
    expect(seen.map((j) => j.hash)).toEqual(['seen1']);
  });

  it('does not mutate the store', () => {
    const store = createSeenStore();
    partitionUnseen([{ hash: 'a' }], store);
    expect(store.size()).toBe(0);
  });
});

describe('rememberAll', () => {
  it('records every job hash', () => {
    const store = createSeenStore();
    rememberAll([{ hash: 'a' }, { hash: 'b' }], store);
    expect(store.has('a')).toBe(true);
    expect(store.has('b')).toBe(true);
  });

  it('supports the find-then-remember cycle across runs', () => {
    const store = createSeenStore();
    const run1 = partitionUnseen([{ hash: 'a' }, { hash: 'b' }], store);
    rememberAll(run1.fresh, store);
    const run2 = partitionUnseen([{ hash: 'b' }, { hash: 'c' }], store);
    expect(run2.fresh.map((j) => j.hash)).toEqual(['c']);
  });
});
