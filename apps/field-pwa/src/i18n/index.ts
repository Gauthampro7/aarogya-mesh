import { lsGet, lsSet } from "../ui/settings";
import { en, type Key } from "./en";
import { hi } from "./hi";

export type Lang = "en" | "hi";
export type { Key };
export const TABLES: Record<Lang, Record<Key, string>> = { en, hi };

let lang: Lang = lsGet("aarogya.lang") === "hi" ? "hi" : "en";

export const getLang = (): Lang => lang;

export function setLang(l: Lang): void {
  lang = l;
  lsSet("aarogya.lang", l);
  if (typeof document !== "undefined") document.documentElement.lang = l;
}

const fill = (s: string, vars?: Record<string, string | number>) =>
  vars ? s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`)) : s;

/** Translate a known key (compile-time checked). */
export function t(key: Key, vars?: Record<string, string | number>): string {
  return fill(TABLES[lang][key] ?? en[key], vars);
}

/** Translate a data-driven key (e.g. from rule-table flags); falls back to `fallback`. */
export function tx(key: string, fallback: string): string {
  const tbl = TABLES[lang] as Record<string, string>;
  return tbl[key] ?? (en as Record<string, string>)[key] ?? fallback;
}
