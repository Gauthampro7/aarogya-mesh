/**
 * Typed Tier-1 CHW Phone sync & event client for Aarogya Mesh.
 *
 * Strictly typed against `packages/contracts/ts/index.ts`.
 * Teammate A can bind this client to IndexedDB for durable offline persistence.
 */

import {
  ActionCard,
  CONTRACT_SCHEMA_VERSION,
  CrdtEvent,
  EnrichmentState,
  EventType,
  HardwareCapabilityManifest,
  HlcTimestamp,
  PatientRecord,
  SyncEnvelope,
  TriageAssessment,
} from "../../../packages/contracts/ts/index";

export interface TriageRequestPayload {
  patient_id?: string | null;
  mode?: "FULL_ASSESSMENT" | "WATCH_RAPID";
  patient_category?: "PEDIATRIC" | "MATERNAL" | "GENERAL" | null;
  age_months?: number | null;
  is_pregnant?: boolean;
  is_postpartum?: boolean;
  gestational_weeks?: number | null;
  danger_signs?: string[];
  symptoms?: string[];
  temperature_c?: number | null;
  respiratory_rate_bpm?: number | null;
  spo2_pct?: number | null;
  systolic_bp?: number | null;
  diastolic_bp?: number | null;
  hemoglobin_g_dl?: number | null;
  muac_cm?: number | null;
  has_cough_or_difficult_breathing?: boolean;
  chest_indrawing?: boolean;
  has_diarrhea?: boolean;
  diarrhea_days?: number;
  blood_in_stool?: boolean;
  dehydration_signs?: string[];
  fever_days?: number;
  bilateral_pedal_edema?: boolean;
  palmar_pallor?: boolean;
  malaria_rdt_positive?: boolean;
  assessed_at_ms?: number | null;
}

export class FieldSyncClient {
  private readonly manifest: HardwareCapabilityManifest;
  private hlc: HlcTimestamp;
  private pendingEvents: CrdtEvent[] = [];
  private sinceCursor: string | null = null;

  constructor(
    nodeId: string,
    private readonly hubBaseUrl = "http://127.0.0.1:8000",
    ramMb = 4096,
    cpuCores = 8,
  ) {
    this.manifest = {
      node_id: nodeId,
      tier: "TIER_1_PHONE",
      ram_mb: ramMb,
      cpu_cores: cpuCores,
      battery_pct: 100,
      has_npu: false,
      installed_models: [],
      watch_mode: null,
    };
    this.hlc = {
      wall_ms: Date.now(),
      logical: 0,
      node_id: nodeId,
    };
  }

  public tickHlc(): HlcTimestamp {
    const now = Date.now();
    if (now > this.hlc.wall_ms) {
      this.hlc = { wall_ms: now, logical: 0, node_id: this.manifest.node_id };
    } else {
      this.hlc = {
        wall_ms: this.hlc.wall_ms,
        logical: this.hlc.logical + 1,
        node_id: this.manifest.node_id,
      };
    }
    return this.hlc;
  }

  public enqueueEvent(
    eventType: EventType,
    payload: Record<string, unknown>,
    options?: {
      patientId?: string | null;
      enrichmentState?: EnrichmentState;
      refEventId?: string | null;
    },
  ): CrdtEvent {
    const event: CrdtEvent = {
      event_id: crypto.randomUUID(),
      hlc: this.tickHlc(),
      origin_node_id: this.manifest.node_id,
      patient_id: options?.patientId ?? null,
      event_type: eventType,
      payload,
      enrichment_state: options?.enrichmentState ?? "NOT_NEEDED",
      ref_event_id: options?.refEventId ?? null,
    };
    this.pendingEvents.push(event);
    return event;
  }

  public registerPatientOffline(patient: PatientRecord): CrdtEvent {
    return this.enqueueEvent(
      "PATIENT_REGISTERED",
      patient as unknown as Record<string, unknown>,
      { patientId: patient.patient_id },
    );
  }

  public queueVoiceNoteOffline(
    patientId: string,
    transcriptHint: string,
    language = "hi",
  ): CrdtEvent {
    return this.enqueueEvent(
      "VOICE_NOTE_RECORDED",
      { transcript_hint: transcriptHint, language },
      { patientId, enrichmentState: "PENDING" },
    );
  }

  public getPendingCount(): number {
    return this.pendingEvents.length;
  }

  public buildSyncEnvelope(): SyncEnvelope {
    return {
      envelope_id: crypto.randomUUID(),
      sender_manifest: this.manifest,
      sender_hlc: this.tickHlc(),
      since_cursor: this.sinceCursor,
      next_cursor: null,
      events: [...this.pendingEvents],
      ack_event_ids: [],
      schema_version: CONTRACT_SCHEMA_VERSION,
    };
  }

  public async syncWithHub(): Promise<SyncEnvelope> {
    const envelope = this.buildSyncEnvelope();
    const response = await fetch(`${this.hubBaseUrl}/api/v1/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(envelope),
    });
    if (!response.ok) {
      throw new Error(`Hub sync failed with status ${response.status}`);
    }
    const delta = (await response.json()) as SyncEnvelope;
    const acked = new Set(delta.ack_event_ids);
    this.pendingEvents = this.pendingEvents.filter((evt) => !acked.has(evt.event_id));
    if (delta.next_cursor) {
      this.sinceCursor = delta.next_cursor;
    }
    return delta;
  }

  public async runHubTriage(request: TriageRequestPayload): Promise<TriageAssessment> {
    const response = await fetch(`${this.hubBaseUrl}/api/v1/triage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      throw new Error(`Hub triage failed with status ${response.status}`);
    }
    return (await response.json()) as TriageAssessment;
  }

  public async fetchActionCards(): Promise<ActionCard[]> {
    const response = await fetch(`${this.hubBaseUrl}/api/v1/action-cards`);
    if (!response.ok) {
      throw new Error(`Failed to fetch action cards: ${response.status}`);
    }
    return (await response.json()) as ActionCard[];
  }

  public connectMeshSocket(onMessage: (payload: unknown) => void): WebSocket {
    const wsUrl = this.hubBaseUrl.replace(/^http/, "ws") + "/ws/mesh";
    const socket = new WebSocket(wsUrl);
    socket.addEventListener("message", (event) => {
      try {
        onMessage(JSON.parse(String(event.data)));
      } catch {
        onMessage(event.data);
      }
    });
    return socket;
  }
}
