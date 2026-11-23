/**
 * Browser entrypoint for the Tier-0 360x360 Dual-Mode Watch Companion PWA.
 * Bundled via `esbuild` into `dist/watch.js` and loaded by `index.html`.
 */

import { DEFAULT_HUB_URL, WatchSyncClient } from "../sync/index";
import { WatchKernel } from "../watch_kernel";
import { mountWatchUi } from "./render";
import { WatchUiController } from "./state";

function bootstrap(): void {
  const root = document.getElementById("watch-app");
  if (!root) {
    return;
  }

  const kernel = new WatchKernel("watch-node-01", "CHW_COMPANION");
  const syncClient = new WatchSyncClient(kernel.getStore(), DEFAULT_HUB_URL);
  const controller = new WatchUiController({ kernel, syncClient });

  mountWatchUi(root, controller);

  if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // Fail-soft if SW registration is blocked (e.g., file:// or private browsing).
    });
  }
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap, { once: true });
  } else {
    bootstrap();
  }
}
