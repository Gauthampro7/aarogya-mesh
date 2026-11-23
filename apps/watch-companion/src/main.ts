/**
 * Browser entrypoint wiring `WatchKernel` into the 360x360 circular watch UI.
 */

import { ActionCard, ActionCardPriority } from "../../../packages/contracts/ts/index";
import { WatchKernel } from "./watch_kernel";

const DEFAULT_NODE_ID = "watch-tier0-local";
const DEFAULT_PATIENT_ID = "patient-watch-quick";

type WatchView = "SCREEN" | "CARDS";

const PRIORITY_COLORS: Record<ActionCardPriority, string> = {
  CRITICAL: "#dc2626",
  HIGH: "#ea580c",
  MEDIUM: "#0d9488",
  LOW: "#475569",
};

function requireEl<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`Missing watch UI element #${id}`);
  }
  return el as T;
}

export function mountWatchApp(kernel: WatchKernel = new WatchKernel(DEFAULT_NODE_ID)): void {
  const toggleBtn = requireEl<HTMLButtonElement>("mode-toggle");
  const viewCardsBtn = requireEl<HTMLButtonElement>("view-cards-btn");
  const screenView = requireEl<HTMLElement>("screen-view");
  const cardsView = requireEl<HTMLElement>("cards-view");
  const titleEl = requireEl<HTMLElement>("watch-title");
  const summaryEl = requireEl<HTMLElement>("watch-summary");
  const primaryBtn = requireEl<HTMLButtonElement>("primary-btn");
  const safeBtn = requireEl<HTMLButtonElement>("safe-btn");
  const cardBadgeEl = requireEl<HTMLElement>("card-priority-badge");
  const cardTitleEl = requireEl<HTMLElement>("card-title");
  const cardSummaryEl = requireEl<HTMLElement>("card-summary");
  const cardAckBtn = requireEl<HTMLButtonElement>("card-ack-btn");
  const cardDoneBtn = requireEl<HTMLButtonElement>("card-done-btn");
  const cardNextBtn = requireEl<HTMLButtonElement>("card-next-btn");
  const footerEl = requireEl<HTMLElement>("watch-footer");

  let activeView: WatchView = "SCREEN";
  let cardIndex = 0;
  let lastFeedback: string | null = null;

  const renderCardPanel = (cards: ActionCard[]): void => {
    if (cards.length === 0) {
      cardBadgeEl.textContent = "CLEAR";
      cardBadgeEl.style.background = "#1e293b";
      cardTitleEl.textContent = "No Active Cards";
      cardSummaryEl.textContent = "Pending cards from Phone/Hub will appear here.";
      cardAckBtn.disabled = true;
      cardDoneBtn.disabled = true;
      cardNextBtn.disabled = true;
      return;
    }

    if (cardIndex >= cards.length) cardIndex = 0;
    const card = cards[cardIndex];
    cardBadgeEl.textContent = `${card.priority} · ${cardIndex + 1}/${cards.length}`;
    cardBadgeEl.style.background = PRIORITY_COLORS[card.priority];
    cardTitleEl.textContent = card.title;
    cardSummaryEl.textContent = card.action_steps[0]
      ? `${card.summary} · ${card.action_steps[0]}`
      : card.summary;
    cardAckBtn.disabled = card.status === "ACKNOWLEDGED";
    cardDoneBtn.disabled = false;
    cardNextBtn.disabled = cards.length <= 1;
  };

  const render = (): void => {
    const mode = kernel.getWatchMode();
    const cards = kernel.getVisibleActionCards();
    toggleBtn.textContent = `MODE: ${mode}`;
    viewCardsBtn.textContent =
      activeView === "CARDS" ? "Back: Screen" : `Cards (${cards.length})`;

    const showCards = activeView === "CARDS";
    screenView.hidden = showCards;
    cardsView.hidden = !showCards;

    if (showCards) {
      renderCardPanel(cards);
    } else if (mode === "CHW_COMPANION") {
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
    footerEl.textContent = `TIER_0_WATCH · ${queued} queued · ${cards.length} card${cards.length === 1 ? "" : "s"}`;
  };

  toggleBtn.addEventListener("click", () => {
    lastFeedback = null;
    cardIndex = 0;
    kernel.toggleWatchMode();
    render();
  });

  viewCardsBtn.addEventListener("click", () => {
    activeView = activeView === "SCREEN" ? "CARDS" : "SCREEN";
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

  cardAckBtn.addEventListener("click", () => {
    const cards = kernel.getVisibleActionCards();
    const card = cards[cardIndex];
    if (card) kernel.updateActionCardStatus(card.card_id, "ACKNOWLEDGED");
    render();
  });

  cardDoneBtn.addEventListener("click", () => {
    const cards = kernel.getVisibleActionCards();
    const card = cards[cardIndex];
    if (card) kernel.updateActionCardStatus(card.card_id, "COMPLETED");
    render();
  });

  cardNextBtn.addEventListener("click", () => {
    const cards = kernel.getVisibleActionCards();
    if (cards.length > 1) {
      cardIndex = (cardIndex + 1) % cards.length;
    }
    render();
  });

  render();
}

if (typeof document !== "undefined") {
  mountWatchApp();
}
