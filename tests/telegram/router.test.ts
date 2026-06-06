import { describe, it, expect } from 'vitest';
import {
  resolveDomain,
  resolveCountry,
  resolveTopN,
  resolveAction,
  TELEGRAM_DOMAINS,
} from '../../src/telegram/router.js';

describe('resolveDomain', () => {
  it.each([
    ['Domain: AI/ML', 'AI, Machine Learning and GenAI'],
    ['I want software roles', 'Software Engineering'],
    ['data engineering', 'Data Engineering'],
    ['cyber security', 'Cybersecurity'],
    ['cloud please', 'Cloud Engineering'],
    ['devops/sre', 'DevOps, Platform and Site Reliability'],
    ['qa testing', 'QA and Test Automation'],
    ['product owner', 'Product and Technical Product'],
  ])('resolves %s to %s', (text, label) => {
    expect(resolveDomain(text)?.label).toBe(label);
  });

  it('returns null when nothing matches', () => {
    expect(resolveDomain('hello there')).toBeNull();
  });

  it('every domain has filter terms', () => {
    expect(TELEGRAM_DOMAINS.every((d) => d.terms.length > 0)).toBe(true);
  });
});

describe('resolveCountry', () => {
  it.each([
    ['country: us', 'US'],
    ['jobs in ireland', 'IE'],
    ['united kingdom roles', 'UK'],
    ['dublin', 'IE'],
    ['nowhere special', ''],
  ])('resolves %s to %s', (text, expected) => {
    expect(resolveCountry(text)).toBe(expected);
  });
});

describe('resolveTopN', () => {
  it.each([
    ['top 25', 25],
    ['show me 10', 10],
    ['top5', 5],
    ['top 7', 0],
    ['no number', 0],
  ])('resolves %s to %i', (text, expected) => {
    expect(resolveTopN(text)).toBe(expected);
  });
});

describe('resolveAction', () => {
  it.each([
    ['run live scan', 'run_scan'],
    ['latest jobs', 'latest_results'],
    ['curated roles', 'curated_roles'],
    ['target companies', 'target_companies'],
    ['urgent deadline', 'deadlines'],
    ['watchlist 2027', 'watchlist'],
    ['job boards', 'portals'],
    ['settings', 'settings'],
    ['/start', 'menu'],
    ['hello', 'menu'],
    ['', 'menu'],
  ])('maps %s to %s', (text, action) => {
    expect(resolveAction(text)).toBe(action);
  });

  it('prioritises scan over later matches', () => {
    expect(resolveAction('scan companies')).toBe('run_scan');
  });
});
