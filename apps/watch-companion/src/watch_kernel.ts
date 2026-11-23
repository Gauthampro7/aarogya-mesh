/**
 * Autonomous Tier-0 Watch Kernel with dual-mode UX (CHW_COMPANION / PATIENT_FAMILY).
 *
 * Strictly typed against `packages/contracts/ts/index.ts` and backed by
 * `WatchStore` + HLC under `src/core/`.
 */

import {
  ActionCard,
  CONTRACT_SCHEMA_VERSION,
  CrdtEvent,
  HardwareCapabilityManifest,
  HlcTimestamp,
  SyncEnvelope,
  TriageSeverity,
  WatchMode,
} from "../../../packages/contracts/ts/index";
import { WatchStore, type StorageLike } from "./core/index";

export interface WatchDangerCheckInput {
  patientId: string;
  unableToDrinkOrBreastfeed: boolean;
  vomitsEverything: boolean;
  convulsions: boolean;
  lethargicOrUnconscious: boolean;
  severeBleeding?: boolean;
}

export interface WatchKernelOptions {
  storage?: StorageLike;
  storageKey?: string;
  store?: WatchStore;
  nowMs?: () => number;
}

export class WatchKernel {
  private readonly store: WatchStore;

  constructor(
    nodeId: string,
    initialMode: WatchMode = "CHW_COMPANION",
    options: WatchKernelOptions = {},
  ) {
    this.store =
      options.store ??
      new WatchStore({
        nodeId,
        initialMode,
        storage: options.storage,
        storageKey: options.storageKey,
        nowMs: options.nowMs,
      });
  }

  public getNodeId(): string {
    return this.store.getNodeId();
  }

  public getStore(): WatchStore {
    return this.store;
  }

  public getWatchMode(): WatchMode {
    return this.store.getWatchMode();
  }

  public setWatchMode(mode: WatchMode): WatchMode {
    return this.store.setWatchMode(mode);
  }

  public toggleWatchMode(): WatchMode {
    return this.store.toggleWatchMode();
  }

  public getManifest(batteryPct = 100): HardwareCapabilityManifest {
    return {
      node_id: this.store.getNodeId(),
      tier: "TIER_0_WATCH",
      ram_mb: 256,
      cpu_cores: 2,
      battery_pct: batteryPct,
      has_npu: false,
      installed_models: [],
      watch_mode: this.store.getWatchMode(),
    };
  }

  public tickHlc(): HlcTimestamp {
    return this.store.tickHlc();
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
      origin_node_id: this.store.getNodeId(),
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
    this.store.appendEvent(event, { enqueueOutbox: true });
    return { severity, event };
  }

  public getVisibleActionCards(): ActionCard[] {
    return this.store.getVisibleActionCards();
  }

  public buildSyncEnvelope(
    sinceCursor: string | null = this.store.getSyncCursor(),
  ): SyncEnvelope {
    return {
      envelope_id: crypto.randomUUID(),
      sender_manifest: this.getManifest(),
      sender_hlc: this.tickHlc(),
      since_cursor: sinceCursor,
      next_cursor: null,
      events: this.store.getOutboxEvents(),
      ack_event_ids: [],
      schema_version: CONTRACT_SCHEMA_VERSION,
    };
  }

  public applySyncResponse(delta: SyncEnvelope): void {
    this.store.applySyncResponse(delta);
  }
}
