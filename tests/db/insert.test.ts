import { describe, it, expect } from 'vitest';
import {
  pgEscape,
  pgNumeric,
  pgTimestamp,
  isEntryLevelTitle,
  buildSql,
} from '../../src/db/insert.js';

describe('pgEscape', () => {
  it.each([
    [null, 'NULL'],
    [undefined, 'NULL'],
    [5, '5'],
    [Number.NaN, '0'],
    [Number.POSITIVE_INFINITY, '0'],
    [true, 'TRUE'],
    [false, 'FALSE'],
    ['acme', "'acme'"],
  ])('escapes %p as %s', (input, expected) => {
    expect(pgEscape(input)).toBe(expected);
  });

  it('doubles single quotes to prevent injection', () => {
    expect(pgEscape("O'Brien")).toBe("'O''Brien'");
    expect(pgEscape("x'; DROP TABLE jobs; --")).toBe("'x''; DROP TABLE jobs; --'");
  });
});

describe('pgNumeric', () => {
  it.each([
    ['5', '5'],
    [3.2, '3.2'],
    ['abc', '0'],
    [null, '0'],
  ])('renders %p as %s', (input, expected) => {
    expect(pgNumeric(input)).toBe(expected);
  });
  it('uses a custom fallback', () => {
    expect(pgNumeric('nope', 7)).toBe('7');
  });
});

describe('pgTimestamp', () => {
  const now = '2026-06-06T00:00:00.000Z';
  it('renders a valid date as a timestamp literal', () => {
    expect(pgTimestamp('2026-06-01T00:00:00.000Z', now)).toBe(
      "'2026-06-01T00:00:00.000Z'::timestamp",
    );
  });
  it('falls back for an invalid/empty date', () => {
    expect(pgTimestamp('not a date', now)).toBe("'2026-06-06T00:00:00.000Z'::timestamp");
    expect(pgTimestamp(null, now)).toBe("'2026-06-06T00:00:00.000Z'::timestamp");
  });
});

describe('isEntryLevelTitle', () => {
  it.each([
    ['Junior Engineer', true],
    ['Graduate Developer', true],
    ['Associate Analyst', true],
    ['Senior Engineer', false],
    ['Software Engineer', false],
    [null, false],
  ])('classifies %p as %p', (title, expected) => {
    expect(isEntryLevelTitle(title)).toBe(expected);
  });
});

describe('buildSql', () => {
  const now = '2026-06-06T00:00:00.000Z';
  const row = {
    company: 'Stripe',
    title: 'Backend Engineer',
    location: 'Dublin',
    country: 'IE',
    jd_text: 'Build payments',
    url: 'https://boards.greenhouse.io/stripe/1',
    source: 'gh:stripe',
    posted_at: '2026-06-01T00:00:00.000Z',
    match_score: 88,
    domain_slug: 'backend_engineering',
    domain_label: 'Backend Engineering',
    matched_role: 'Backend Engineer',
    matched_alias: 'Backend Engineer',
    keyword_hits: 'api, rest',
    alias_count: 900,
    telegram_chat_id: '123',
  };

  it('builds an upsert with the conflict and returning clauses', () => {
    const sql = buildSql(row, now);
    expect(sql).toContain('INSERT INTO jobs');
    expect(sql).toContain('ON CONFLICT (original_url) DO UPDATE');
    expect(sql).toContain('RETURNING');
    expect(sql).toContain("'backend_engineering' AS domain_slug");
    expect(sql).toContain('88 AS match_score');
    expect(sql.endsWith(';')).toBe(true);
  });

  it('escapes injection attempts in the company name', () => {
    const sql = buildSql({ ...row, company: "Rob'); DROP TABLE jobs;--" }, now);
    expect(sql).toContain("'Rob''); DROP TABLE jobs;--'");
    expect(sql).not.toContain("Rob'); DROP");
  });

  it('applies defaults for missing fields', () => {
    const sql = buildSql({ url: 'https://a/1' }, now);
    expect(sql).toContain("'Unknown'");
    expect(sql).toContain("'Untitled role'");
    expect(sql).toContain("'IE'");
  });

  it('sets is_graduate from the title', () => {
    expect(buildSql({ ...row, title: 'Graduate Engineer' }, now)).toContain('TRUE,0)');
    expect(buildSql({ ...row, title: 'Backend Engineer' }, now)).toContain('FALSE,0)');
  });
});
