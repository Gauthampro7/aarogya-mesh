export interface VoiceNotePayload {
  transcript_hint: string;
  language: string;
  audio_blob_key: string | null;
  mime_type: string | null;
  duration_ms: number;
}

export const canRecordAudio = (): boolean =>
  typeof MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

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
