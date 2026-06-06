import { describe, it, expect } from 'vitest';
import { COMPANY_BOARDS } from '../../src/sources/boards.js';

describe('COMPANY_BOARDS', () => {
  it('has the three ATS providers', () => {
    expect(Object.keys(COMPANY_BOARDS).sort()).toEqual(['ashby', 'greenhouse', 'lever']);
  });

  it.each(['greenhouse', 'lever', 'ashby'] as const)('%s list is non-empty', (provider) => {
    expect(COMPANY_BOARDS[provider].length).toBeGreaterThan(0);
  });

  it.each(['greenhouse', 'lever', 'ashby'] as const)('%s slugs are unique', (provider) => {
    const list = COMPANY_BOARDS[provider];
    expect(new Set(list).size).toBe(list.length);
  });

  it.each(['greenhouse', 'lever', 'ashby'] as const)('%s slugs are clean', (provider) => {
    expect(COMPANY_BOARDS[provider].every((s) => /^[a-z0-9-]+$/.test(s))).toBe(true);
  });

  it('tracks a substantial number of boards overall', () => {
    const total =
      COMPANY_BOARDS.greenhouse.length + COMPANY_BOARDS.lever.length + COMPANY_BOARDS.ashby.length;
    expect(total).toBeGreaterThan(150);
  });
});
