import { describe, it, expect } from 'vitest';
import { jobSeniorityBlocked } from '../../src/matching/seniority.js';

describe('jobSeniorityBlocked — hard blocklist', () => {
  it.each([
    'Senior Software Engineer',
    'Sr Developer',
    'Staff Engineer',
    'Principal Engineer',
    'Lead Developer',
    'Director of Engineering',
    'Head of Data',
    'VP of Engineering',
    'Chief Architect',
    'CTO',
    'CISO',
    'Engineering Manager',
    'Software Development Manager',
    'Team Manager',
  ])('blocks "%s"', (title) => {
    expect(jobSeniorityBlocked(title)).toBe(true);
  });
});

describe('jobSeniorityBlocked — word-boundary guards', () => {
  it.each([
    'Headless CMS Developer', // must not trip \bhead\b
    'Leadership Programme Engineer', // must not trip \blead\b
    'Disrupter Engineer', // must not trip \bsr\b inside a word
  ])('does not block "%s"', (title) => {
    expect(jobSeniorityBlocked(title)).toBe(false);
  });
});

describe('jobSeniorityBlocked — allowed entry/normal roles', () => {
  it.each([
    'Junior Engineer',
    'Graduate Developer',
    'Associate Software Engineer',
    'Software Engineer',
    'Backend Developer',
    'Product Manager',
  ])('allows "%s"', (title) => {
    expect(jobSeniorityBlocked(title)).toBe(false);
  });
});

describe('jobSeniorityBlocked — extra blocklist', () => {
  it('blocks titles matching a caller-supplied term', () => {
    expect(jobSeniorityBlocked('Intern Developer', undefined, ['intern'])).toBe(true);
  });

  it('ignores the bare "manager" term so Product Manager survives', () => {
    expect(jobSeniorityBlocked('Product Manager', undefined, ['manager'])).toBe(false);
  });

  it('matches extra terms on whole-phrase boundaries only', () => {
    expect(jobSeniorityBlocked('Contractor Role', undefined, ['contract'])).toBe(false);
    expect(jobSeniorityBlocked('Contract Role', undefined, ['contract'])).toBe(true);
  });

  it('tolerates a non-array blocklist', () => {
    expect(
      jobSeniorityBlocked('Software Engineer', undefined, undefined as unknown as string[]),
    ).toBe(false);
  });
});

describe('jobSeniorityBlocked — degenerate input', () => {
  it.each([null, undefined, ''])('does not block empty title %p', (title) => {
    expect(jobSeniorityBlocked(title)).toBe(false);
  });

  it('ignores the domainSlug argument', () => {
    expect(jobSeniorityBlocked('Senior Engineer', 'any_slug')).toBe(true);
    expect(jobSeniorityBlocked('Junior Engineer', 'any_slug')).toBe(false);
  });
});
