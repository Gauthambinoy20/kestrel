import { describe, it, expect } from 'vitest';
import { sqlString, curatedSql } from '../../src/telegram/sql.js';

describe('sqlString', () => {
  it('wraps a value in single quotes', () => {
    expect(sqlString('acme')).toBe("'acme'");
  });
  it('escapes embedded single quotes (injection-safe)', () => {
    expect(sqlString("O'Brien")).toBe("'O''Brien'");
    expect(sqlString("x'; DROP TABLE jobs; --")).toBe("'x''; DROP TABLE jobs; --'");
  });
  it('handles null/undefined/number', () => {
    expect(sqlString(null)).toBe("''");
    expect(sqlString(undefined)).toBe("''");
    expect(sqlString(5)).toBe("'5'");
  });
});

describe('curatedSql', () => {
  const prefs = { domain: 'Software Engineering', top_n: 10 };

  it('builds a curated_roles query with a domain filter and clamped limit', () => {
    const sql = curatedSql('curated_roles', prefs);
    expect(sql).toContain('FROM curated_roles');
    expect(sql).toContain('ILIKE');
    expect(sql).toContain('LIMIT 10;');
  });

  it.each([
    ['target_companies', 'FROM curated_companies'],
    ['deadlines', 'FROM curated_deadlines'],
    ['watchlist', 'FROM curated_watchlist'],
    ['portals', 'FROM curated_portals'],
  ])('builds the %s query', (action, table) => {
    expect(curatedSql(action, prefs)).toContain(table);
  });

  it('clamps the limit between 5 and 25', () => {
    expect(curatedSql('deadlines', { domain: 'x', top_n: 100 })).toContain('LIMIT 25;');
    expect(curatedSql('deadlines', { domain: 'x', top_n: 1 })).toContain('LIMIT 5;');
    expect(curatedSql('deadlines', { domain: 'x', top_n: 12 })).toContain('LIMIT 12;');
  });

  it('returns a harmless empty query for an unknown action', () => {
    expect(curatedSql('nonsense', prefs)).toBe("SELECT 'empty' AS result_type WHERE false;");
  });

  it('falls back to the first domain when the label is unknown', () => {
    // unknown domain label still produces a valid filtered query
    const sql = curatedSql('curated_roles', { domain: 'No Such Domain', top_n: 5 });
    expect(sql).toContain('ILIKE');
  });
});
