import { getLang, t } from "../../i18n";
import { field, h } from "../dom";
import type { Ctx } from "../ctx";
import { getAudio, putAudio } from "../audio_store";
import { buildVoiceHistory, buildVoicePayload, formatDurationMmSs, recordingUnavailableReason, voiceNoteValid } from "../voice_logic";
import { uuid } from "../../core/uuid";

export async function voice(ctx: Ctx): Promise<HTMLElement> {
  const [patients, allEvents] = await Promise.all([ctx.store.listPatients(), ctx.store.getAllEvents()]);
  const pSel = h("select", { name: "patient" }, h("option", { value: "" }, t("triage.anon")), patients.map((p) => h("option", { value: p.patient_id }, p.full_name)));
  const hint = h("textarea", { name: "hint", rows: 4, maxlength: 2000 });
  const status = h("p", { role: "status", "aria-live": "polite" });
  const player = h("audio", { controls: true, hidden: true });
  let blob: Blob | null = null;
  let startedAt = 0;
  let durationMs = 0;
  let rec: MediaRecorder | null = null;
  let stream: MediaStream | null = null;
  let previewUrl: string | null = null;
  let tick: ReturnType<typeof setInterval> | undefined;
  let torn = false;
  const timerEl = h("span", { class: "rec-timer", "aria-label": t("voice.elapsed"), hidden: true }, "00:00");
  const discardBtn = h("button", { type: "button", hidden: true, onclick: () => discard() }, t("voice.discard"));

  const stopTimer = () => {
    clearInterval(tick);
    tick = undefined;
  };
  function revokePreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
    player.removeAttribute("src");
    player.hidden = true;
    discardBtn.hidden = true;
  }
  function discard() {
    revokePreview();
    blob = null;
    durationMs = 0;
    status.className = "muted";
    status.textContent = t("voice.discarded");
  }

  const recBtn = h("button", { type: "button", class: "bigbtn danger", onclick: () => void toggle() }, t("voice.start"));
  const saveBtn = h("button", { type: "button", class: "primary", onclick: () => void save() }, t("voice.save"));

  async function toggle() {
    if (rec && rec.state === "recording") {
      rec.stop();
      return;
    }
    try {
      revokePreview();
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream = s;
      const chunks: Blob[] = [];
      rec = new MediaRecorder(s);
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = () => {
        s.getTracks().forEach((tr) => tr.stop());
        stopTimer();
        if (torn) return;
        durationMs = Date.now() - startedAt;
        blob = new Blob(chunks, { type: rec?.mimeType || "audio/webm" });
        revokePreview();
        previewUrl = URL.createObjectURL(blob);
        player.src = previewUrl;
        player.hidden = false;
        discardBtn.hidden = false;
        recBtn.textContent = t("voice.start");
        status.textContent = t("voice.recorded");
      };
      startedAt = Date.now();
      rec.start();
      timerEl.textContent = "00:00";
      timerEl.hidden = false;
      tick = setInterval(() => {
        if (!root.isConnected) return teardown(); // same-route rerender (e.g. language toggle) left us detached
        timerEl.textContent = formatDurationMmSs(Date.now() - startedAt);
      }, 500);
      recBtn.textContent = t("voice.stop");
      status.textContent = t("voice.recording");
    } catch {
      stopTimer();
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
      revokePreview();
      durationMs = 0;
      await drawHistory();
    } catch (e) {
      status.className = "error";
      status.textContent = `${t("triage.saveFail")} ${String(e)}`;
    }
  }

  const historyBox = h("div", { class: "voice-history" });
  const SEV_KEY = { RED_EMERGENCY: "sev.red", YELLOW_PHC: "sev.yellow", GREEN_HOME: "sev.green" } as const;
  const activeUrls: string[] = [];

  async function drawHistory() {
    const [latestPatients, latestEvents] = await Promise.all([ctx.store.listPatients(), ctx.store.getAllEvents()]);
    const items = buildVoiceHistory(latestEvents, latestPatients);
    if (items.length === 0) {
      historyBox.replaceChildren(h("p", { class: "muted" }, t("voice.historyEmpty")));
      return;
    }
    const loc = getLang() === "hi" ? "hi-IN" : getLang() === "kn" ? "kn-IN" : "en-IN";
    const listItems = await Promise.all(
      items.map(async (item) => {
        let localAudioEl: HTMLElement | null = null;
        if (item.blobKey) {
          try {
            const localBlob = await getAudio(item.blobKey);
            if (localBlob) {
              const u = URL.createObjectURL(localBlob);
              activeUrls.push(u);
              localAudioEl = h("audio", { controls: true, src: u });
            }
          } catch {
            // Local blob may have been cleared or unavailable.
          }
        }
        const badgeText = item.status === "COMPLETED" ? t("voice.statusCompleted") : t("voice.statusPending");
        const metaLine = `${item.patientName ?? t("triage.anon")} · ${new Date(item.recordedAtMs).toLocaleString(loc)}${item.durationMs > 0 ? ` · ${formatDurationMmSs(item.durationMs)}` : ""}`;
        return h(
          "li",
          { class: `card ${item.severity ? `sev-${item.severity}` : ""}` },
          h(
            "div",
            {},
            h("strong", {}, badgeText),
            item.severity ? [" ", h("span", { class: `sevbadge sev-${item.severity}` }, t(SEV_KEY[item.severity]))] : null,
          ),
          h("p", { class: "muted" }, metaLine),
          item.transcriptHint ? h("p", {}, item.transcriptHint) : null,
          localAudioEl,
          item.transcript ? h("p", {}, h("strong", {}, `${t("voice.transcript")}: `), item.transcript) : null,
          item.symptoms.length ? h("p", {}, h("strong", {}, `${t("voice.symptoms")}: `), item.symptoms.join(", ")) : null,
          item.riskBand !== null && item.riskScore !== null
            ? h("p", { class: "muted" }, t("voice.riskScore", { band: item.riskBand, score: item.riskScore.toFixed(2) }))
            : null,
          item.followUp ? h("p", {}, item.followUp) : null,
        );
      }),
    );
    historyBox.replaceChildren(h("ul", { class: "list" }, listItems));
  }
  void drawHistory();

  // Leaving the screen or the page: stop the mic, timer and preview URL.
  const teardown = () => {
    window.removeEventListener("pagehide", teardown);
    window.removeEventListener("hashchange", teardown);
    torn = true;
    stopTimer();
    if (rec?.state === "recording") rec.stop();
    stream?.getTracks().forEach((tr) => tr.stop());
    revokePreview();
    while (activeUrls.length) URL.revokeObjectURL(activeUrls.pop()!);
  };
  window.addEventListener("pagehide", teardown);
  window.addEventListener("hashchange", teardown);

  const reason = recordingUnavailableReason();
  const root = h(
    "section",
    {},
    h("h1", {}, t("voice.title")),
    field(t("triage.patient"), pSel),
    reason === "insecure_context"
      ? h("p", { class: "muted" }, t("voice.insecureContext"))
      : reason === "unsupported"
        ? h("p", { class: "muted" }, t("voice.unsupported"))
        : h("div", {}, recBtn, " ", timerEl),
    h("div", { class: "voice-actions" }, player, discardBtn),
    field(t("voice.hint"), hint, t("voice.hintNote")),
    saveBtn,
    status,
    h("h2", {}, t("voice.historyTitle")),
    historyBox,
  );
  // Suppress unused warning when allEvents was preloaded; drawHistory refreshes live.
  void allEvents;
  return root;
}
