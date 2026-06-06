import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createSeenStore, type SeenStore } from '../features/seen-store.js';

/**
 * Load a seen-store from a JSON file of hashes. A missing or unreadable file
 * yields an empty store rather than throwing, so a first run (or a corrupt
 * file) degrades gracefully to "nothing seen yet".
 */
export function loadSeenStore(path: string): SeenStore {
  if (!existsSync(path)) return createSeenStore();
  try {
    const data: unknown = JSON.parse(readFileSync(path, 'utf8'));
    const hashes = Array.isArray(data) ? data.filter((x): x is string => typeof x === 'string') : [];
    return createSeenStore(hashes);
  } catch {
    return createSeenStore();
  }
}

/** Persist a seen-store to a JSON file (creating parent directories). */
export function saveSeenStore(path: string, store: SeenStore): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(store.values()));
}
