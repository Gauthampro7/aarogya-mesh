export interface VoiceNotePayload {
  transcript_hint: string;
  language: string;
  audio_blob_key: string | null;
  mime_type: string | null;
  duration_ms: number;
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
