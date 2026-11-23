/**
 * Offline persistence adapter for the Tier-0 Watch Kernel.
 *
 * Uses browser `localStorage` when available and falls back to an in-memory
 * store for Node tests or restricted environments.
 */

import {
  ActionCard,
  CrdtEvent,
  HlcTimestamp,
  WatchMode,
} from "../../../packages/contracts/ts/index";

export interface WatchPersistedState {
  watchMode: WatchMode;
  hlc: HlcTimestamp;
  eventQueue: CrdtEvent[];
  actionCards: ActionCard[];
  sinceCursor: string | null;
}

export interface WatchStorage {
  load(): WatchPersistedState | null;
  save(state: WatchPersistedState): void;
}

export function createMemoryStorage(): WatchStorage {
  let snapshot: string | null = null;
  return {
    load(): WatchPersistedState | null {
      return snapshot ? (JSON.parse(snapshot) as WatchPersistedState) : null;
    },
    save(state: WatchPersistedState): void {
      snapshot = JSON.stringify(state);
    },
  };
}

export function createBrowserStorage(nodeId: string): WatchStorage {
  const storageKey = `aarogya-watch:${nodeId}`;
  return {
    load(): WatchPersistedState | null {
      try {
        const raw = globalThis.localStorage?.getItem(storageKey);
        return raw ? (JSON.parse(raw) as WatchPersistedState) : null;
      } catch {
        return null;
      }
    },
    save(state: WatchPersistedState): void {
      try {
        globalThis.localStorage?.setItem(storageKey, JSON.stringify(state));
      } catch {
        // Best-effort offline persistence; kernel keeps running in memory.
      }
    },
  };
}

export function resolveDefaultStorage(nodeId: string): WatchStorage {
  try {
    if (typeof globalThis.localStorage !== "undefined") {
      return createBrowserStorage(nodeId);
    }
  } catch {
    // Ignore environments where accessing localStorage throws.
  }
  return createMemoryStorage();
}
