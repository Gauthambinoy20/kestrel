import { describe, it, expect, afterEach } from 'vitest';
import { writeFileSync, rmSync, existsSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadSeenStore, saveSeenStore } from '../../src/runtime/seen-file.js';
import { createSeenStore } from '../../src/features/seen-store.js';

const dir = mkdtempSync(join(tmpdir(), 'kestrel-seen-'));
const paths: string[] = [];
const p = (name: string): string => {
  const full = join(dir, name);
  paths.push(full);
  return full;
};

afterEach(() => {
  for (const path of paths) if (existsSync(path)) rmSync(path);
  paths.length = 0;
});

describe('seen-file persistence', () => {
  it('returns an empty store when the file does not exist', () => {
    expect(loadSeenStore(p('missing.json')).size()).toBe(0);
  });

  it('round-trips a store through save and load', () => {
    const path = p('seen.json');
    const store = createSeenStore(['a', 'b', 'c']);
    saveSeenStore(path, store);
    const loaded = loadSeenStore(path);
    expect(loaded.size()).toBe(3);
    expect(loaded.has('b')).toBe(true);
  });

  it('creates parent directories on save', () => {
    const path = join(dir, 'nested', 'deep', 'seen.json');
    paths.push(path);
    saveSeenStore(path, createSeenStore(['x']));
    expect(existsSync(path)).toBe(true);
  });

  it('degrades to empty on a corrupt file', () => {
    const path = p('corrupt.json');
    writeFileSync(path, '{not json');
    expect(loadSeenStore(path).size()).toBe(0);
  });

  it('ignores non-string entries in the file', () => {
    const path = p('mixed.json');
    writeFileSync(path, JSON.stringify(['ok', 42, null, 'good']));
    expect(loadSeenStore(path).values()).toEqual(['ok', 'good']);
  });
});
