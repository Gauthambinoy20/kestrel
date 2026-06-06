import { describe, it, expect } from 'vitest';
import { escapeMarkdownV2, chunkMessage } from '../../src/delivery/telegram-format.js';

describe('escapeMarkdownV2', () => {
  it('escapes all MarkdownV2 special characters', () => {
    expect(escapeMarkdownV2('a_b*c[d]e.f!')).toBe('a\\_b\\*c\\[d\\]e\\.f\\!');
  });
  it('escapes backslashes and leaves plain text intact', () => {
    expect(escapeMarkdownV2('plain text 123')).toBe('plain text 123');
    expect(escapeMarkdownV2('a\\b')).toBe('a\\\\b');
  });
  it.each([null, undefined, ''])('handles empty input %p', (input) => {
    expect(escapeMarkdownV2(input)).toBe('');
  });
});

describe('chunkMessage', () => {
  it('returns a single chunk when under the limit', () => {
    expect(chunkMessage('short', 100)).toEqual(['short']);
  });

  it('returns no chunks for empty text', () => {
    expect(chunkMessage('', 100)).toEqual([]);
  });

  it('splits on line boundaries and loses nothing', () => {
    const lines = Array.from({ length: 50 }, (_, i) => `line ${i}`);
    const chunks = chunkMessage(lines.join('\n'), 40);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((c) => c.length <= 40)).toBe(true);
    expect(chunks.join('\n')).toBe(lines.join('\n'));
  });

  it('hard-splits a single over-long line', () => {
    const chunks = chunkMessage('x'.repeat(250), 100);
    expect(chunks).toHaveLength(3);
    expect(chunks.join('')).toBe('x'.repeat(250));
  });
});
