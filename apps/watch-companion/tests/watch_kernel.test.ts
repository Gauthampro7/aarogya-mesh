import { describe, expect, it } from "vitest";
import { ActionCard, SyncEnvelope } from "../../../packages/contracts/ts/index";
import { createMemoryStorage } from "../src/storage";
import { WatchKernel } from "../src/watch_kernel";

describe("WatchKernel offline persistence & clinical safety", () => {
  it("persists watchMode, HLC, and queued events across restarts", () => {
    const storage = createMemoryStorage();
    const first = new WatchKernel("watch-01", "CHW_COMPANION", storage);
    first.setWatchMode("PATIENT_FAMILY");
    const { severity, event } = first.screenDangerSigns({
      patientId: "p-101",
      unableToDrinkOrBreastfeed: true,
      vomitsEverything: false,
      convulsions: false,
      lethargicOrUnconscious: false,
    });

    expect(severity).toBe("RED_EMERGENCY");
    expect(event.payload.referral_required).toBe(true);
    expect(event.payload.confidence).toBe(1.0);
    expect(event.payload.execution_target).toBe("LOCAL_DETERMINISTIC");

    const restored = new WatchKernel("watch-01", "CHW_COMPANION", storage);
    expect(restored.getWatchMode()).toBe("PATIENT_FAMILY");
    expect(restored.getQueuedCount()).toBe(1);
    expect(restored.getQueuedEvents()[0]?.event_id).toBe(event.event_id);
  });

  it("returns GREEN_HOME when no danger signs are present", () => {
    const kernel = new WatchKernel("watch-02", "CHW_COMPANION", createMemoryStorage());
    const { severity, event } = kernel.screenDangerSigns({
      patientId: "p-102",
      unableToDrinkOrBreastfeed: false,
      vomitsEverything: false,
      convulsions: false,
      lethargicOrUnconscious: false,
    });

    expect(severity).toBe("GREEN_HOME");
    expect(event.payload.referral_required).toBe(false);
    expect(kernel.getQueuedCount()).toBe(1);
  });

  it("advances HLC, clears acked events, saves cursor, and deduplicates ActionCards", () => {
    const storage = createMemoryStorage();
    const kernel = new WatchKernel("watch-03", "CHW_COMPANION", storage);
    const { event } = kernel.screenDangerSigns({
      patientId: "p-103",
      unableToDrinkOrBreastfeed: false,
      vomitsEverything: true,
      convulsions: false,
      lethargicOrUnconscious: false,
    });

    const card: ActionCard = {
      card_id: "card-1",
      patient_id: "p-103",
      title: "Urgent Referral",
      summary: "Call 108 immediately",
      action_steps: ["Refer to PHC/FRU"],
      priority: "CRITICAL",
      severity: "RED_EMERGENCY",
      status: "OPEN",
      target_tier: "TIER_0_WATCH",
      watch_mode: "CHW_COMPANION",
      source_event_id: event.event_id,
      due_by: null,
      language: "en",
    };

    const futureWall = Date.now() + 50_000;
    const response: SyncEnvelope = {
      envelope_id: "env-1",
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
      sender_hlc: { wall_ms: futureWall, logical: 4, node_id: "phc-hub" },
      since_cursor: null,
      next_cursor: "cursor-42",
      events: [
        {
          event_id: "evt-card-1",
          hlc: { wall_ms: futureWall, logical: 5, node_id: "phc-hub" },
          origin_node_id: "phc-hub",
          patient_id: "p-103",
          event_type: "ACTION_CARD_ISSUED",
          payload: card as unknown as Record<string, unknown>,
          enrichment_state: "COMPLETED",
          ref_event_id: event.event_id,
        },
      ],
      ack_event_ids: [event.event_id],
      schema_version: "1.0.0",
    };

    kernel.applySyncResponse(response);

    expect(kernel.getQueuedCount()).toBe(0);
    expect(kernel.getSinceCursor()).toBe("cursor-42");
    expect(kernel.getHlc().wall_ms).toBeGreaterThanOrEqual(futureWall);
    expect(kernel.getVisibleActionCards()).toHaveLength(1);

    // Replay same card + checklist status update -> stays deduplicated and updates status
    kernel.applySyncResponse({
      ...response,
      events: [
        ...response.events,
        {
          event_id: "evt-card-ack",
          hlc: { wall_ms: futureWall, logical: 6, node_id: "phc-hub" },
          origin_node_id: "phc-hub",
          patient_id: "p-103",
          event_type: "CHECKLIST_RECORDED",
          payload: { card_id: "card-1", status: "ACKNOWLEDGED" },
          enrichment_state: "NOT_NEEDED",
          ref_event_id: null,
        },
      ],
    });

    const cards = kernel.getVisibleActionCards();
    expect(cards).toHaveLength(1);
    expect(cards[0]?.status).toBe("ACKNOWLEDGED");
  });
});
