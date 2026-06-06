import { escapeHtml } from '../delivery/digest.js';
import {
  resolveDomain,
  resolveCountry,
  resolveTopN,
  resolveAction,
  type TelegramAction,
} from './router.js';
import { curatedSql } from './sql.js';

/** A chat's persisted preferences. */
export interface TelegramPrefs {
  domain: string;
  country: string;
  top_n: number;
}

/** Default preferences for a chat with no saved state. */
export const DEFAULT_PREFS: TelegramPrefs = {
  domain: 'AI, Machine Learning and GenAI',
  country: 'IE',
  top_n: 10,
};

/**
 * Apply any domain/country/count selections found in a message to the current
 * preferences, leaving unmentioned fields unchanged. Pure: returns a new object
 * so the caller decides how to persist it.
 */
export function resolvePrefs(
  current: TelegramPrefs | undefined,
  text: string | null | undefined,
): TelegramPrefs {
  const prefs: TelegramPrefs = { ...(current ?? DEFAULT_PREFS) };
  const domain = resolveDomain(text);
  if (domain) prefs.domain = domain.label;
  const country = resolveCountry(text);
  if (country) prefs.country = country;
  const topN = resolveTopN(text);
  if (topN) prefs.top_n = topN;
  return prefs;
}

function statusLine(prefs: TelegramPrefs): string {
  return `<b>Kestrel</b>\n${escapeHtml(prefs.domain)} · ${escapeHtml(prefs.country)} · top ${prefs.top_n}`;
}

/** Render the control-panel message body for an action. */
export function buildMenuText(action: TelegramAction, prefs: TelegramPrefs): string {
  const status = statusLine(prefs);
  const byAction: Record<TelegramAction, string> = {
    menu: `${status}\n\n<b>Main</b>\nUse the buttons below. This Telegram chat is the control panel.`,
    settings: `${status}\n\n<b>Settings</b>\nChoose the domain, country and result count. Then use curated roles or run a live scan.`,
    run_scan: `${status}\n\nLive scan queued. I will send the ranked digest here when it finishes.`,
    latest_results: `${status}\n\nFetching the latest live-scraped jobs.`,
    curated_roles: `${status}\n\nFetching curated graduate/entry roles from the seed data.`,
    target_companies: `${status}\n\nFetching target companies from the seed data.`,
    deadlines: `${status}\n\nFetching urgent deadline items from the seed data.`,
    watchlist: `${status}\n\nFetching watchlist companies and programme timing.`,
    portals: `${status}\n\nFetching the best job portals/search sources from the seed data.`,
  };
  return byAction[action];
}

/** An inbound Telegram message reduced to what the router needs. */
export interface IncomingMessage {
  chatId: number | string;
  text: string;
}

/** The resolved command the workflow acts on for a message. */
export interface TelegramCommand {
  chatId: number | string;
  incomingText: string;
  action: TelegramAction;
  domain: string;
  country: string;
  top_n: number;
  curatedSql: string;
  menuText: string;
}

/**
 * Turn an inbound message + current prefs into the command to act on, returning
 * the updated prefs alongside so the adapter can persist them. This is the pure
 * core of the Telegram-menu node — no n8n static-store coupling.
 */
export function buildTelegramCommand(
  incoming: IncomingMessage,
  currentPrefs: TelegramPrefs | undefined,
): { command: TelegramCommand; prefs: TelegramPrefs } {
  const text = String(incoming.text || '').trim();
  const prefs = resolvePrefs(currentPrefs, text);
  const action = resolveAction(text);

  return {
    prefs,
    command: {
      chatId: incoming.chatId,
      incomingText: text,
      action,
      domain: prefs.domain,
      country: prefs.country,
      top_n: prefs.top_n,
      curatedSql: curatedSql(action, prefs),
      menuText: buildMenuText(action, prefs),
    },
  };
}
