import type { CrdtEvent, PatientRecord, TriageSeverity } from "../../../../packages/contracts/ts/index";

export interface VoiceNotePayload {
  transcript_hint: string;
  language: string;
  audio_blob_key: string | null;
  mime_type: string | null;
  duration_ms: number;
}

export interface VoiceHistoryItem {
  eventId: string;
  patientId: string | null;
  patientName: string | null;
  recordedAtMs: number;
  originNodeId: string;
  transcriptHint: string;
  blobKey: string | null;
  durationMs: number;
  status: "PENDING" | "COMPLETED";
  transcript: string | null;
  symptoms: string[];
  dangerFlags: string[];
  severity: TriageSeverity | null;
  riskBand: string | null;
  riskScore: number | null;
  followUp: string | null;
}

export function buildVoiceHistory(
  events: readonly CrdtEvent[],
  patients: readonly Pick<PatientRecord, "patient_id" | "full_name">[],
): VoiceHistoryItem[] {
  const byPatient = new Map(patients.map((p) => [p.patient_id, p.full_name]));
  const enrichByRef = new Map<string, CrdtEvent>();
  for (const e of events) {
    if (e.event_type === "ENRICHMENT_COMPLETED" && e.ref_event_id) {
      enrichByRef.set(e.ref_event_id, e);
    }
  }
  const items: VoiceHistoryItem[] = [];
  for (const e of events) {
    if (e.event_type !== "VOICE_NOTE_RECORDED") continue;
    const p = (e.payload ?? {}) as Record<string, unknown>;
    const enr = enrichByRef.get(e.event_id);
    const ep = (enr?.payload ?? {}) as Record<string, unknown>;
    const trans = (ep.transcription ?? {}) as Record<string, unknown>;
    const note = (ep.structured_note ?? {}) as Record<string, unknown>;
    const triage = (ep.triage_assessment ?? {}) as Record<string, unknown>;
    const risk = (ep.risk_score ?? {}) as Record<string, unknown>;
    const sev = typeof triage.severity === "string" ? (triage.severity as TriageSeverity) : null;
    items.push({
      eventId: e.event_id,
      patientId: e.patient_id,
      patientName: e.patient_id ? (byPatient.get(e.patient_id) ?? e.patient_id) : null,
      recordedAtMs: e.hlc.wall_ms,
      originNodeId: e.origin_node_id,
      transcriptHint: typeof p.transcript_hint === "string" ? p.transcript_hint : "",
      blobKey: typeof p.audio_blob_key === "string" && p.audio_blob_key ? p.audio_blob_key : null,
      durationMs: typeof p.duration_ms === "number" ? p.duration_ms : 0,
      status: enr ? "COMPLETED" : "PENDING",
      transcript: typeof trans.transcript === "string" ? trans.transcript : null,
      symptoms: Array.isArray(note.extracted_symptoms) ? note.extracted_symptoms.map(String) : [],
      dangerFlags: Array.isArray(note.candidate_danger_flags) ? note.candidate_danger_flags.map(String) : [],
      severity: sev,
      riskBand: typeof risk.risk_band === "string" ? risk.risk_band : null,
      riskScore: typeof risk.risk_score === "number" ? risk.risk_score : null,
      followUp: typeof note.recommended_follow_up === "string" ? note.recommended_follow_up : null,
    });
  }
  return items.sort((a, b) => b.recordedAtMs - a.recordedAtMs);
}

export const canRecordAudio = (): boolean =>
  typeof MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

/** Why recording cannot work here, or null when it can. */
export function recordingUnavailableReason(
  env: { isSecureContext?: unknown; MediaRecorder?: unknown; navigator?: { mediaDevices?: { getUserMedia?: unknown } } } = globalThis as never,
): "insecure_context" | "unsupported" | null {
  if (typeof env.isSecureContext === "boolean" && !env.isSecureContext) return "insecure_context";
  if (typeof env.MediaRecorder === "undefined" || !env.navigator?.mediaDevices?.getUserMedia) return "unsupported";
  return null;
}

/** Elapsed time as MM:SS (minutes keep growing past 59). */
export function formatDurationMmSs(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "00:00";
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** Payload for VOICE_NOTE_RECORDED (typed-only notes have no audio key). */
export function buildVoicePayload(o: {
  hint: string;
  language: string;
  blobKey: string | null;
  mime: string | null;
  durationMs: number;
}): VoiceNotePayload {
  return {
    transcript_hint: o.hint.trim(),
    language: o.language,
    audio_blob_key: o.blobKey,
    mime_type: o.mime,
    duration_ms: Math.max(0, Math.round(o.durationMs)),
  };
}

/** A note needs audio or typed text. */
export const voiceNoteValid = (p: VoiceNotePayload): boolean => p.audio_blob_key !== null || p.transcript_hint.length > 0;
