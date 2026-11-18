import en from '../content/locales/en.json';
import hi from '../content/locales/hi.json';

/** UI languages shipped in v1. Add a locale file and an entry here to add one. */
export const LANGS = ['en', 'hi'] as const;
export type Lang = (typeof LANGS)[number];
export type MessageKey = keyof typeof en;

/** Each language's own name, shown on the toggle that switches to it. */
export const LANG_NAMES: Record<Lang, string> = { en: 'English', hi: 'हिन्दी' };

const MESSAGES: Record<Lang, Partial<Record<MessageKey, string>>> = { en, hi };
const STORAGE_KEY = 'md_lang';

/** Looks up a UI string. A key missing from the locale falls back to English. */
export function t(lang: Lang, key: MessageKey): string {
  const text = MESSAGES[lang][key];
  if (text !== undefined) return text;
  if (import.meta.env.DEV) console.warn(`[i18n] "${key}" is missing in ${lang}; using English`);
  return en[key];
}

export function nextLang(lang: Lang): Lang {
  return LANGS[(LANGS.indexOf(lang) + 1) % LANGS.length] ?? 'en';
}

/** Storage can throw in private browsing; the app must still work. */
export function loadLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return LANGS.find((l) => l === saved) ?? 'en';
  } catch {
    return 'en';
  }
}

export function saveLang(lang: Lang): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* not saved; the toggle still works for this visit */
  }
}
