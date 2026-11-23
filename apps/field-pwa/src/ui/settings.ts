import { uuid } from "../core/uuid";
/** Persisted UI settings. localStorage may be unavailable: every access is guarded. */
export const DEFAULT_HUB_URL = "http://127.0.0.1:8000";

export function lsGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
export function lsSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export const getHubUrl = (): string => lsGet("aarogya.hubUrl") || DEFAULT_HUB_URL;
export const setHubUrl = (url: string): void => lsSet("aarogya.hubUrl", url.trim().replace(/\/+$/, ""));

/** Stable per-device node id. */
export function getNodeId(): string {
  let id = lsGet("aarogya.nodeId");
  if (!id) {
    id = `phone-${uuid().slice(0, 8)}`;
    lsSet("aarogya.nodeId", id);
  }
  return id;
}

export function getLastSync(): { at: number; ok: boolean; detail: string } | null {
  try {
    return JSON.parse(lsGet("aarogya.lastSync") ?? "null");
  } catch {
    return null;
  }
}
export const setLastSync = (v: { at: number; ok: boolean; detail: string }): void =>
  lsSet("aarogya.lastSync", JSON.stringify(v));

/** Valid http(s) URL check for the hub setting. */
export function isValidHubUrl(s: string): boolean {
  try {
    const u = new URL(s.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
