import { describe, it, expect } from 'vitest';
import {
  resolvePrefs,
  buildMenuText,
  buildTelegramCommand,
  DEFAULT_PREFS,
} from '../../src/telegram/menu.js';

describe('resolvePrefs', () => {
  it('returns defaults for a new chat with a neutral message', () => {
    expect(resolvePrefs(undefined, 'hello')).toEqual(DEFAULT_PREFS);
  });

  it('updates domain, country and count from the message', () => {
    const prefs = resolvePrefs(undefined, 'software jobs in uk top 25');
    expect(prefs).toEqual({ domain: 'Software Engineering', country: 'UK', top_n: 25 });
  });

  it('keeps existing prefs for fields the message does not mention', () => {
    const current = { domain: 'Cybersecurity', country: 'US', top_n: 15 };
    expect(resolvePrefs(current, 'just checking')).toEqual(current);
  });

  it('does not mutate the passed-in prefs', () => {
    const current = { domain: 'Cybersecurity', country: 'US', top_n: 15 };
    resolvePrefs(current, 'cloud top 5');
    expect(current).toEqual({ domain: 'Cybersecurity', country: 'US', top_n: 15 });
  });
});

describe('buildMenuText', () => {
  it('includes the Kestrel brand and the prefs status line', () => {
    const text = buildMenuText('menu', DEFAULT_PREFS);
    expect(text).toContain('<b>Kestrel</b>');
    expect(text).toContain('AI, Machine Learning and GenAI · IE · top 10');
  });

  it('has a distinct body per action', () => {
    expect(buildMenuText('run_scan', DEFAULT_PREFS)).toContain('Live scan queued');
    expect(buildMenuText('settings', DEFAULT_PREFS)).toContain('Settings');
  });
});

describe('buildTelegramCommand', () => {
  it('resolves action, prefs, curated SQL and menu text', () => {
    const { command, prefs } = buildTelegramCommand(
      { chatId: 42, text: 'curated roles data top 15' },
      undefined,
    );
    expect(command.action).toBe('curated_roles');
    expect(command.domain).toBe('Data Engineering');
    expect(command.top_n).toBe(15);
    expect(command.curatedSql).toContain('FROM curated_roles');
    expect(command.menuText).toContain('Kestrel');
    expect(command.chatId).toBe(42);
    // returned prefs reflect the update for persistence
    expect(prefs.domain).toBe('Data Engineering');
  });

  it('trims the incoming text', () => {
    const { command } = buildTelegramCommand({ chatId: 1, text: '  scan  ' }, undefined);
    expect(command.incomingText).toBe('scan');
    expect(command.action).toBe('run_scan');
  });

  it('carries forward saved prefs when the message changes nothing', () => {
    const saved = { domain: 'Cloud Engineering', country: 'US', top_n: 20 };
    const { command } = buildTelegramCommand({ chatId: 1, text: 'latest jobs' }, saved);
    expect(command.action).toBe('latest_results');
    expect(command.country).toBe('US');
    expect(command.top_n).toBe(20);
  });
});
