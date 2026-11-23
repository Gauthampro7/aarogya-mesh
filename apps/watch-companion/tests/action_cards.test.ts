import { describe, expect, it } from "vitest";
import {
  ActionCard,
  ActionCardPriority,
  SyncEnvelope,
  WatchMode,
} from "../../../packages/contracts/ts/index";
import { createMemoryStorage } from "../src/storage";
import { WatchKernel } from "../src/watch_kernel";

function makeCard(
  id: string,
  priority: ActionCardPriority,
  watchMode: WatchMode | null,
): ActionCard {
  return {
    card_id: id,
    patient_id: "p-200",
    title: `Card ${id}`,
    summary: `Summary for ${id}`,
    action_steps: ["Follow protocol"],
    priority,
    severity: priority === "CRITICAL" ? "RED_EMERGENCY" : null,
    status: "OPEN",
    target_tier: "TIER_0_WATCH",
    watch_mode: watchMode,
    source_event_id: `src-${id}`,
    due_by: null,
    language: "en",
  };
}

function makeEnvelope(cards: ActionCard[]): SyncEnvelope {
  const now = Date.now() + 10_000;
  return {
    envelope_id: "env-cards",
    sender_manifest: {
      node_id: "phc-hub",
      tier: "TIER_2_HUB",
      ram_mb: 16384,
      cpu_cores: 8,
      battery_pct: 100,
      has_npu: true,
      installed_models: [],
      watch_mode: null,
    },
    sender_hlc: { wall_ms: now, logical: 1, node_id: "phc-hub" },
    since_cursor: null,
    next_cursor: "cursor-cards",
    events: cards.map((card, i) => ({
      event_id: `evt-${card.card_id}`,
      hlc: { wall_ms: now, logical: i + 2, node_id: "phc-hub" },
      origin_node_id: "phc-hub",
      patient_id: card.patient_id,
      event_type: "ACTION_CARD_ISSUED",
      payload: card as unknown as Record<string, unknown>,
      enrichment_state: "COMPLETED",
      ref_event_id: card.source_event_id,
    })),
    ack_event_ids: [],
    schema_version: "1.0.0",
  };
}

describe("ActionCard filtering, priority sorting, and status updates", () => {
  it("filters by watch_mode (including null) and sorts CRITICAL -> LOW", () => {
    const kernel = new WatchKernel("watch-cards-1", "CHW_COMPANION", createMemoryStorage());
    kernel.applySyncResponse(
      makeEnvelope([
        makeCard("c-low", "LOW", "CHW_COMPANION"),
        makeCard("c-family", "CRITICAL", "PATIENT_FAMILY"),
        makeCard("c-med", "MEDIUM", null),
        makeCard("c-crit", "CRITICAL", "CHW_COMPANION"),
        makeCard("c-high", "HIGH", "CHW_COMPANION"),
      ]),
    );

    const chwCards = kernel.getVisibleActionCards();
    expect(chwCards.map((c) => c.card_id)).toEqual([
      "c-crit",
      "c-high",
      "c-med",
      "c-low",
    ]);

    kernel.setWatchMode("PATIENT_FAMILY");
    const familyCards = kernel.getVisibleActionCards();
    expect(familyCards.map((c) => c.card_id)).toEqual(["c-family", "c-med"]);
  });

  it("emits CHECKLIST_RECORDED on status update and hides COMPLETED cards by default", () => {
    const storage = createMemoryStorage();
    const kernel = new WatchKernel("watch-cards-2", "CHW_COMPANION", storage);
    kernel.applySyncResponse(
      makeEnvelope([
        makeCard("c-1", "CRITICAL", "CHW_COMPANION"),
        makeCard("c-2", "HIGH", "CHW_COMPANION"),
      ]),
    );

    const ackEvent = kernel.updateActionCardStatus("c-1", "ACKNOWLEDGED");
    expect(ackEvent?.event_type).toBe("CHECKLIST_RECORDED");
    expect(ackEvent?.payload).toEqual({ card_id: "c-1", status: "ACKNOWLEDGED" });
    expect(kernel.getVisibleActionCards().map((c) => c.card_id)).toEqual(["c-1", "c-2"]);

    const doneEvent = kernel.updateActionCardStatus("c-1", "COMPLETED");
    expect(doneEvent?.payload).toEqual({ card_id: "c-1", status: "COMPLETED" });
    expect(kernel.getVisibleActionCards().map((c) => c.card_id)).toEqual(["c-2"]);
    expect(kernel.getVisibleActionCards(true)).toHaveLength(2);
    expect(kernel.getQueuedCount()).toBe(2);

    const restored = new WatchKernel("watch-cards-2", "CHW_COMPANION", storage);
    expect(restored.getVisibleActionCards().map((c) => c.card_id)).toEqual(["c-2"]);
  });
});
