import { describe, it, expect } from 'vitest';
import { normalizeText, stripTitleNoise, containsPhrase } from '../../src/text/normalize.js';

describe('normalizeText', () => {
  it('lower-cases input', () => {
    expect(normalizeText('Backend Engineer')).toBe('backend engineer');
  });

  it('expands ampersands to "and"', () => {
    expect(normalizeText('Research & Development')).toBe('research and development');
  });

  it('collapses separators (._+/()-) to spaces', () => {
    expect(normalizeText('Node.js/React (Full-Stack)')).toBe('node js react full stack');
  });

  it('drops punctuation that is not a letter, digit, # or space', () => {
    expect(normalizeText('C++, C#, .NET!')).toBe('c c# net');
  });

  it('preserves # so tokens like c# survive', () => {
    expect(normalizeText('C# Developer')).toBe('c# developer');
  });

  it('squeezes repeated whitespace and trims', () => {
    expect(normalizeText('  Data    Engineer \n')).toBe('data engineer');
  });

  it.each([
    [null, ''],
    [undefined, ''],
    ['', ''],
    [0, ''],
    [false, ''],
    ['   ', ''],
  ])('coerces non-string / empty input %p to %p', (input, expected) => {
    expect(normalizeText(input)).toBe(expected);
  });

  it('stringifies numbers that are truthy', () => {
    expect(normalizeText(42)).toBe('42');
  });
});

describe('stripTitleNoise', () => {
  it.each([
    ['Junior Backend Engineer II', 'backend engineer'],
    ['Graduate Data Analyst', 'data analyst'],
    ['Associate Software Engineer I', 'software engineer'],
    ['Remote Contract Frontend Developer', 'frontend developer'],
    ['New Grad Machine Learning Engineer', 'machine learning engineer'],
    ['Apprentice Trainee QA', 'qa'],
  ])('strips qualifier noise: %s -> %s', (input, expected) => {
    expect(stripTitleNoise(input)).toBe(expected);
  });

  it('leaves a clean core title untouched', () => {
    expect(stripTitleNoise('Cloud Engineer')).toBe('cloud engineer');
  });

  it('only strips noise words on word boundaries (does not touch "iii")', () => {
    // "ii" is a noise token, but it must match as a whole word, not inside others.
    expect(stripTitleNoise('Engineer III')).toBe('engineer iii');
  });

  it('returns empty string when the title is only noise', () => {
    expect(stripTitleNoise('Junior Graduate Trainee')).toBe('');
  });
});

describe('containsPhrase', () => {
  it('matches a whole phrase surrounded by word boundaries', () => {
    expect(containsPhrase('Senior Go Developer', 'go')).toBe(true);
  });

  it('does not match a substring inside a larger word', () => {
    expect(containsPhrase('a very good role', 'go')).toBe(false);
  });

  it('matches multi-word phrases', () => {
    expect(containsPhrase('Machine Learning Engineer', 'machine learning')).toBe(true);
  });

  it('normalises both sides before comparing', () => {
    expect(containsPhrase('R&D Lead', 'research and development')).toBe(false);
    expect(containsPhrase('Research & Development', 'research and development')).toBe(true);
  });

  it.each([
    ['anything', ''],
    ['anything', null],
    ['anything', undefined],
    ['', 'go'],
    [null, 'go'],
  ])('returns false for empty/missing operands (%p, %p)', (hay, phrase) => {
    expect(containsPhrase(hay, phrase)).toBe(false);
  });
});
