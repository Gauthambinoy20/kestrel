import { describe, it, expect } from 'vitest';
import { VERSION, ENGINE } from '../src/version.js';

describe('engine identity', () => {
  it('exposes a semantic version string', () => {
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('identifies itself as kestrel', () => {
    expect(ENGINE).toBe('kestrel');
  });
});
