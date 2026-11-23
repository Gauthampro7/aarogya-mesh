/** Glue: periodic / opportunistic sync scheduling (best effort, never awaited by user actions). */
import type { SyncEngine } from "../sync";
import { setLastSync } from "./settings";

export const SYNC_INTERVAL_MS = 30_000;

export function runSync(engine: SyncEngine): Promise<void> {
  return engine.syncNow().then((res) => {
    const st = engine.status;
    setLastSync({
      at: Date.now(),
      ok: res !== null,
      detail: res === null ? st : "ok",
    });
  }, () => undefined);
}

export function startSyncLoop(engine: SyncEngine, isOnline: () => boolean = () => navigator.onLine): () => void {
  const tick = () => {
    if (isOnline()) void runSync(engine);
  };
  const timer = setInterval(tick, SYNC_INTERVAL_MS);
  const onOnline = () => tick();
  window.addEventListener("online", onOnline);
  tick();
  return () => {
    clearInterval(timer);
    window.removeEventListener("online", onOnline);
  };
}
