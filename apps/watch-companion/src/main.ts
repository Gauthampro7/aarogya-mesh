/**
 * Browser entrypoint wiring `WatchKernel` into the 360x360 circular watch UI.
 */

import { WatchKernel } from "./watch_kernel";

const DEFAULT_NODE_ID = "watch-tier0-local";
const DEFAULT_PATIENT_ID = "patient-watch-quick";

function requireEl<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`Missing watch UI element #${id}`);
  }
  return el as T;
}

export function mountWatchApp(kernel: WatchKernel = new WatchKernel(DEFAULT_NODE_ID)): void {
  const toggleBtn = requireEl<HTMLButtonElement>("mode-toggle");
  const titleEl = requireEl<HTMLElement>("watch-title");
  const summaryEl = requireEl<HTMLElement>("watch-summary");
  const primaryBtn = requireEl<HTMLButtonElement>("primary-btn");
  const safeBtn = requireEl<HTMLButtonElement>("safe-btn");
  const footerEl = requireEl<HTMLElement>("watch-footer");

  let lastFeedback: string | null = null;

  const render = (): void => {
    const mode = kernel.getWatchMode();
    toggleBtn.textContent = `MODE: ${mode}`;
    if (mode === "CHW_COMPANION") {
      titleEl.textContent = "1-Tap Danger Screen";
      summaryEl.textContent =
        lastFeedback ?? "Offline ASHA rapid check · Zero network required.";
      primaryBtn.textContent = "Flag Danger Sign (RED)";
      primaryBtn.style.background = "#dc2626";
      safeBtn.textContent = "No Danger Signs (GREEN)";
    } else {
      titleEl.textContent = "Family Reminder";
      summaryEl.textContent =
        lastFeedback ?? "Daily vaccine / medicine check & SOS trigger.";
      primaryBtn.textContent = "Request Help (SOS)";
      primaryBtn.style.background = "#d97706";
      safeBtn.textContent = "Check-In OK (GREEN)";
    }
    const queued = kernel.getQueuedCount();
    footerEl.textContent = `TIER_0_WATCH · ${queued} queued event${queued === 1 ? "" : "s"}`;
  };

  toggleBtn.addEventListener("click", () => {
    lastFeedback = null;
    kernel.toggleWatchMode();
    render();
  });

  primaryBtn.addEventListener("click", () => {
    const result = kernel.screenDangerSigns({
      patientId: DEFAULT_PATIENT_ID,
      unableToDrinkOrBreastfeed: true,
      vomitsEverything: false,
      convulsions: false,
      lethargicOrUnconscious: false,
    });
    lastFeedback = `${result.severity} queued · Call 108 / PHC referral.`;
    render();
  });

  safeBtn.addEventListener("click", () => {
    const result = kernel.screenDangerSigns({
      patientId: DEFAULT_PATIENT_ID,
      unableToDrinkOrBreastfeed: false,
      vomitsEverything: false,
      convulsions: false,
      lethargicOrUnconscious: false,
    });
    lastFeedback = `${result.severity} logged offline.`;
    render();
  });

  render();
}

if (typeof document !== "undefined") {
  mountWatchApp();
}
