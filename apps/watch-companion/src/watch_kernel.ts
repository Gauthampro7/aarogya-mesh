/**
 * Autonomous Tier-0 Watch Kernel with dual-mode UX (CHW_COMPANION / PATIENT_FAMILY).
 *
 * Strictly typed against `packages/contracts/ts/index.ts`.
 */

import {
  ActionCard,
  ActionCardPriority,
  ActionCardStatus,
  CONTRACT_SCHEMA_VERSION,
  CrdtEvent,
  HardwareCapabilityManifest,
  HlcTimestamp,
  SyncEnvelope,
  TriageSeverity,
  WatchMode,
} from "../../../packages/contracts/ts/index";
import { resolveDefaultStorage, WatchStorage } from "./storage";

const PRIORITY_RANK: Record<ActionCardPriority, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

const CLOSED_CARD_STATUSES = new Set<ActionCardStatus>(["COMPLETED", "DISMISSED"]);

export interface WatchDangerCheckInput {
  patientId: string;
  unableToDrinkOrBreastfeed: boolean;
  vomitsEverything: boolean;
  convulsions: boolean;
  lethargicOrUnconscious: boolean;
  severeBleeding?: boolean;
}

export class WatchKernel {
  private watchMode: WatchMode = "CHW_COMPANION";
  private hlc: HlcTimestamp;
  private eventQueue: CrdtEvent[] = [];
  private actionCards: ActionCard[] = [];
  private sinceCursor: string | null = null;
  private readonly storage: WatchStorage;

  constructor(
    private readonly nodeId: string,
    initialMode: WatchMode = "CHW_COMPANION",
    storage: WatchStorage = resolveDefaultStorage(nodeId),
  ) {
    this.storage = storage;
    const saved = this.storage.load();
    if (saved) {
      this.watchMode = saved.watchMode;
      this.hlc = saved.hlc;
      this.eventQueue = saved.eventQueue;
      this.actionCards = saved.actionCards;
      this.sinceCursor = saved.sinceCursor;
    } else {
      this.watchMode = initialMode;
      this.hlc = { wall_ms: Date.now(), logical: 0, node_id: nodeId };
      this.persist();
    }
  }

  private persist(): void {
    this.storage.save({
      watchMode: this.watchMode,
      hlc: this.hlc,
      eventQueue: this.eventQueue,
      actionCards: this.actionCards,
      sinceCursor: this.sinceCursor,
    });
  }

  public getNodeId(): string {
    return this.nodeId;
  }

  public getWatchMode(): WatchMode {
    return this.watchMode;
  }

  public getHlc(): HlcTimestamp {
    return this.hlc;
  }

  public getQueuedCount(): number {
    return this.eventQueue.length;
  }

  public getQueuedEvents(): readonly CrdtEvent[] {
    return this.eventQueue;
  }

  public getSinceCursor(): string | null {
    return this.sinceCursor;
  }

  public setWatchMode(mode: WatchMode): WatchMode {
    this.watchMode = mode;
    this.persist();
    return this.watchMode;
  }

  public toggleWatchMode(): WatchMode {
    this.watchMode =
      this.watchMode === "CHW_COMPANION" ? "PATIENT_FAMILY" : "CHW_COMPANION";
    this.persist();
    return this.watchMode;
  }

  public getManifest(batteryPct = 100): HardwareCapabilityManifest {
    return {
      node_id: this.nodeId,
      tier: "TIER_0_WATCH",
      ram_mb: 256,
      cpu_cores: 2,
      battery_pct: batteryPct,
      has_npu: false,
      installed_models: [],
      watch_mode: this.watchMode,
    };
  }

  public tickHlc(nowMs: number = Date.now()): HlcTimestamp {
    if (nowMs > this.hlc.wall_ms) {
      this.hlc = { wall_ms: nowMs, logical: 0, node_id: this.nodeId };
    } else {
      this.hlc = {
        wall_ms: this.hlc.wall_ms,
        logical: this.hlc.logical + 1,
        node_id: this.nodeId,
      };
    }
    this.persist();
    return this.hlc;
  }

  /** Merge a remote HLC timestamp so causal order advances monotonically. */
  public receiveHlc(
    remote: HlcTimestamp,
    nowMs: number = Date.now(),
  ): HlcTimestamp {
    const wall = Math.max(this.hlc.wall_ms, remote.wall_ms, nowMs);
    let logical = 0;
    if (wall === this.hlc.wall_ms && wall === remote.wall_ms) {
      logical = Math.max(this.hlc.logical, remote.logical) + 1;
    } else if (wall === this.hlc.wall_ms) {
      logical = this.hlc.logical + 1;
    } else if (wall === remote.wall_ms) {
      logical = remote.logical + 1;
    }
    this.hlc = { wall_ms: wall, logical, node_id: this.nodeId };
    this.persist();
    return this.hlc;
  }

  /**
   * Deterministic Tier-0 danger-sign check: any single red flag forces RED_EMERGENCY.
   * Emits a strict TriageAssessment payload validated by `aarogya_crdt_sync.project_state`.
   */
  public screenDangerSigns(input: WatchDangerCheckInput): {
    severity: TriageSeverity;
    event: CrdtEvent;
  } {
    const matchedRules: string[] = [];
    if (input.unableToDrinkOrBreastfeed) matchedRules.push("not_able_to_drink_or_breastfeed");
    if (input.vomitsEverything) matchedRules.push("vomits_everything");
    if (input.convulsions) matchedRules.push("convulsions");
    if (input.lethargicOrUnconscious) matchedRules.push("lethargic_or_unconscious");
    if (input.severeBleeding) matchedRules.push("vaginal_bleeding");

    const hasDangerSign = matchedRules.length > 0;
    const severity: TriageSeverity = hasDangerSign
      ? "RED_EMERGENCY"
      : "GREEN_HOME";

    const hlc = this.tickHlc();
    const event: CrdtEvent = {
      event_id: crypto.randomUUID(),
      hlc,
      origin_node_id: this.nodeId,
      patient_id: input.patientId,
      event_type: "TRIAGE_COMPLETED",
      payload: {
        assessment_id: crypto.randomUUID(),
        patient_id: input.patientId,
        severity,
        matched_rules: hasDangerSign ? matchedRules : ["WATCH_RAPID_NO_DANGER_SIGNS"],
        immediate_actions: hasDangerSign
          ? ["Immediate 108 emergency referral to PHC/FRU"]
          : ["Continue home monitoring and routine ASHA follow-up"],
        referral_required: hasDangerSign,
        rationale: hasDangerSign
          ? `Tier-0 Watch danger sign detected (${matchedRules.join(", ")}).`
          : "No immediate danger signs detected on Tier-0 Watch screen.",
        confidence: 1.0,
        protocol_source: "WHO_IMNCI_ASHA_WATCH_RAPID",
        execution_target: "LOCAL_DETERMINISTIC",
        assessed_at_ms: hlc.wall_ms,
      },
      enrichment_state: "NOT_NEEDED",
      ref_event_id: null,
    };
    this.eventQueue.push(event);
    this.persist();
    return { severity, event };
  }

  public getVisibleActionCards(includeClosed = false): ActionCard[] {
    return this.actionCards
      .filter(
        (card) =>
          (card.watch_mode === null || card.watch_mode === this.watchMode) &&
          (includeClosed || !CLOSED_CARD_STATUSES.has(card.status)),
      )
      .sort((a, b) => {
        const priDiff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
        if (priDiff !== 0) return priDiff;
        if (a.status !== b.status) return a.status === "OPEN" ? -1 : 1;
        return a.card_id.localeCompare(b.card_id);
      });
  }

  public updateActionCardStatus(
    cardId: string,
    status: ActionCardStatus,
  ): CrdtEvent | null {
    const idx = this.actionCards.findIndex((card) => card.card_id === cardId);
    if (idx === -1) return null;

    const current = this.actionCards[idx];
    this.actionCards[idx] = { ...current, status };

    const event: CrdtEvent = {
      event_id: crypto.randomUUID(),
      hlc: this.tickHlc(),
      origin_node_id: this.nodeId,
      patient_id: current.patient_id,
      event_type: "CHECKLIST_RECORDED",
      payload: {
        card_id: current.card_id,
        status,
      },
      enrichment_state: "NOT_NEEDED",
      ref_event_id: current.source_event_id,
    };
    this.eventQueue.push(event);
    this.persist();
    return event;
  }

  public buildSyncEnvelope(
    sinceCursor: string | null = this.sinceCursor,
  ): SyncEnvelope {
    return {
      envelope_id: crypto.randomUUID(),
      sender_manifest: this.getManifest(),
      sender_hlc: this.tickHlc(),
      since_cursor: sinceCursor,
      next_cursor: null,
      events: [...this.eventQueue],
      ack_event_ids: [],
      schema_version: CONTRACT_SCHEMA_VERSION,
    };
  }

  public applySyncResponse(delta: SyncEnvelope): void {
    this.receiveHlc(delta.sender_hlc);
    const acked = new Set(delta.ack_event_ids);
    this.eventQueue = this.eventQueue.filter((evt) => !acked.has(evt.event_id));
    if (delta.next_cursor) {
      this.sinceCursor = delta.next_cursor;
    }

    const cardsById = new Map(this.actionCards.map((c) => [c.card_id, c]));
    for (const evt of delta.events) {
      this.receiveHlc(evt.hlc);
      if (evt.event_type === "ACTION_CARD_ISSUED") {
        const card = evt.payload as unknown as ActionCard;
        if (card.card_id) {
          cardsById.set(card.card_id, card);
        }
      } else if (
        evt.event_type === "CHECKLIST_RECORDED" &&
        typeof evt.payload.card_id === "string" &&
        typeof evt.payload.status === "string"
      ) {
        const existing = cardsById.get(evt.payload.card_id);
        if (existing) {
          cardsById.set(existing.card_id, {
            ...existing,
            status: evt.payload.status as ActionCardStatus,
          });
        }
      }
    }
    this.actionCards = Array.from(cardsById.values());
    this.persist();
  }
}
