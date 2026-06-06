/**
 * Kestrel — public entry point.
 *
 * The engine is built as a pure, typed library so every piece of logic is
 * unit-testable in isolation. n8n Code nodes and the CLI runner are thin
 * adapters over this surface; they hold no business logic of their own.
 */
export { VERSION, ENGINE } from './version.js';
