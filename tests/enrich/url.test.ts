import { describe, it, expect } from 'vitest';
import { safeUrl, baseDomain, cleanCompanySlug, looseNormalize } from '../../src/enrich/url.js';

describe('safeUrl', () => {
  it('parses a simple https URL', () => {
    expect(safeUrl('https://Acme.com/jobs/1')).toEqual({
      protocol: 'https:',
      hostname: 'acme.com',
      href: 'https://Acme.com/jobs/1',
    });
  });

  it('accepts http', () => {
    expect(safeUrl('http://a.com')?.protocol).toBe('http:');
  });

  it('strips userinfo and port from the hostname', () => {
    expect(safeUrl('https://user:pass@acme.com:8443/x')?.hostname).toBe('acme.com');
  });

  it.each([
    'ftp://acme.com',
    'mailto:a@b.com',
    'acme.com',
    '',
    '   ',
    'https://',
    'https:// space.com',
  ])('rejects %p', (input) => {
    expect(safeUrl(input)).toBeNull();
  });

  it.each([null, undefined])('rejects %p', (input) => {
    expect(safeUrl(input)).toBeNull();
  });
});

describe('baseDomain', () => {
  it.each([
    ['www.acme.com', 'acme.com'],
    ['jobs.acme.com', 'acme.com'],
    ['acme.com', 'acme.com'],
    ['acme.co.uk', 'acme.co.uk'],
    ['jobs.acme.co.uk', 'acme.co.uk'],
    ['careers.example.com.au', 'example.com.au'],
    ['localhost', 'localhost'],
    ['', ''],
  ])('reduces %s -> %s', (input, expected) => {
    expect(baseDomain(input)).toBe(expected);
  });
});

describe('cleanCompanySlug', () => {
  it.each([
    ['Acme Technologies Inc', 'acme'],
    ['Stripe, Inc.', 'stripe'],
    ['Hugging Face', 'huggingface'],
    ['OpenAI', 'openai'],
  ])('slugifies %s -> %s', (input, expected) => {
    expect(cleanCompanySlug(input)).toBe(expected);
  });

  it('falls back to the un-stripped slug when stripping empties it', () => {
    // "AI" is itself a stripped suffix word; the fallback keeps it.
    expect(cleanCompanySlug('AI')).toBe('ai');
  });

  it('handles empty input', () => {
    expect(cleanCompanySlug('')).toBe('');
    expect(cleanCompanySlug(null)).toBe('');
  });
});

describe('looseNormalize', () => {
  it('keeps dots and hyphens but lower-cases and expands &', () => {
    expect(looseNormalize('Acme-Corp.io & Co')).toBe('acme-corp.io and co');
  });
});
