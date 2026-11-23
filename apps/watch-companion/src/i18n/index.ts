import { en, type Key } from "./en";
import { hi } from "./hi";

export type Lang = "en" | "hi";
export type { Key };

export const TABLES: Record<Lang, Record<Key, string>> = { en, hi };

const LANG_STORAGE_KEY = "aarogya.watch.lang";

function readStoredLang(): Lang {
  try {
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem(LANG_STORAGE_KEY) === "hi" ? "hi" : "en";
    }
  } catch {
    // Ignore storage access errors in restricted contexts.
  }
  return "en";
}

let currentLang: Lang = readStoredLang();

export function getLang(): Lang {
  return currentLang;
}

export function setLang(lang: Lang): Lang {
  currentLang = lang;
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    }
  } catch {
    // Ignore storage access errors in restricted contexts.
  }
  if (typeof document !== "undefined") {
    document.documentElement.lang = lang;
  }
  return currentLang;
}

export function toggleLang(): Lang {
  return setLang(currentLang === "en" ? "hi" : "en");
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
}

export function t(key: Key, vars?: Record<string, string | number>, langOverride?: Lang): string {
  const active = langOverride ?? currentLang;
  const raw = TABLES[active][key] ?? en[key];
  return interpolate(raw, vars);
}

export function tx(key: string, fallback: string, vars?: Record<string, string | number>): string {
  const table = TABLES[currentLang] as Record<string, string>;
  const enTable = en as Record<string, string>;
  return interpolate(table[key] ?? enTable[key] ?? fallback, vars);
}
