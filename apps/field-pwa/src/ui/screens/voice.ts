import { getLang, t } from "../../i18n";
import { field, h } from "../dom";
import type { Ctx } from "../ctx";
import { putAudio } from "../audio_store";
import { buildVoicePayload, canRecordAudio, voiceNoteValid } from "../voice_logic";
import { uuid } from "../../core/uuid";

export async function voice(ctx: Ctx): Promise<HTMLElement> {
  const patients = await ctx.store.listPatients();
  const pSel = h("select", { name: "patient" }, h("option", { value: "" }, t("triage.anon")), patients.map((p) => h("option", { value: p.patient_id }, p.full_name)));
  const hint = h("textarea", { name: "hint", rows: 4, maxlength: 2000 });
  const status = h("p", { role: "status", "aria-live": "polite" });
  const player = h("audio", { controls: true, hidden: true });
  let blob: Blob | null = null;
  let startedAt = 0;
  let durationMs = 0;
  let rec: MediaRecorder | null = null;

  const recBtn = h("button", { type: "button", class: "bigbtn danger", onclick: () => void toggle() }, t("voice.start"));
  const saveBtn = h("button", { type: "button", class: "primary", onclick: () => void save() }, t("voice.save"));

  async function toggle() {
    if (rec && rec.state === "recording") {
      rec.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: Blob[] = [];
      rec = new MediaRecorder(stream);
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop());
        durationMs = Date.now() - startedAt;
        blob = new Blob(chunks, { type: rec?.mimeType || "audio/webm" });
        player.src = URL.createObjectURL(blob);
        player.hidden = false;
        recBtn.textContent = t("voice.start");
        status.textContent = t("voice.recorded");
      };
      startedAt = Date.now();
      rec.start();
      recBtn.textContent = t("voice.stop");
      status.textContent = t("voice.recording");
    } catch {
      status.textContent = t("voice.denied");
      status.className = "error";
    }
  }

  async function save() {
    const key = blob ? `vn-${uuid()}` : null;
    const payload = buildVoicePayload({ hint: hint.value, language: getLang(), blobKey: key, mime: blob?.type ?? null, durationMs });
    if (!voiceNoteValid(payload)) {
      status.className = "error";
      status.textContent = t("voice.empty");
      return;
    }
    try {
      if (blob && key) await putAudio(key, blob); // local blob first, then the event
      await ctx.engine.enqueue({
        event_type: "VOICE_NOTE_RECORDED",
        patient_id: pSel.value || null,
        enrichment_state: "PENDING",
        payload: { ...payload },
      });
      ctx.syncSoon();
      status.className = "ok";
      status.textContent = t("voice.saved");
      blob = null;
      hint.value = "";
      player.hidden = true;
      durationMs = 0;
    } catch (e) {
      status.className = "error";
      status.textContent = `${t("triage.saveFail")} ${String(e)}`;
    }
  }

  const supported = canRecordAudio();
  return h(
    "section",
    {},
    h("h1", {}, t("voice.title")),
    field(t("triage.patient"), pSel),
    supported ? recBtn : h("p", { class: "muted" }, t("voice.unsupported")),
    player,
    field(t("voice.hint"), hint, t("voice.hintNote")),
    saveBtn,
    status,
  );
}
