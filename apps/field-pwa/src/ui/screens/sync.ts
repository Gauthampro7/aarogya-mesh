import type { ActionCard } from "../../../../../packages/contracts/ts/index";
import { t } from "../../i18n";
import { field, h } from "../dom";
import type { Ctx } from "../ctx";
import { heldClipsFromDetail, runSync } from "../app_state";
import { clearHubUrl, getAutoHubOrigin, getHubUrl, getLastSync, isValidHubUrl, setHubUrl } from "../settings";
import { ackPayload, bindLiveCount, buildCrdtNodeProof, cardPatientLabel, sortCards } from "../sync_logic";

export async function syncPanel(ctx: Ctx): Promise<HTMLElement> {
  const [pending, cards, patients, allEvents] = await Promise.all([
    ctx.engine.pendingCount(),
    ctx.store.listActionCards(),
    ctx.store.listPatients(),
    ctx.store.getAllEvents(),
  ]);
  const byId = new Map(patients.map((p) => [p.patient_id, p]));
  const proof = buildCrdtNodeProof(ctx.nodeId, allEvents, pending, ctx.engine.status);
  const last = getLastSync();
  const held = last ? heldClipsFromDetail(last.detail) : 0;
  const lastText = !last ? "" : last.ok ? t("sync.ok") : held ? t("sync.clipsWaiting", { n: held }) : t("sync.fail", { s: last.detail });
  const url = h("input", { type: "url", name: "hub", value: getHubUrl(), inputmode: "url", autocapitalize: "off" });
  const auto = getAutoHubOrigin();
  const msg = h("p", { role: "status", "aria-live": "polite" });

  const saveUrl = () => {
    const raw = url.value.trim().replace(/\/+$/, "");
    if (raw === "" || raw === auto) {
      // Empty (or the automatic value itself): drop the override so the address keeps tracking the page origin.
      clearHubUrl();
      url.value = getHubUrl();
      ctx.engine.hubUrl = url.value;
      return true;
    }
    if (!isValidHubUrl(url.value)) {
      msg.className = "error";
      msg.textContent = t("sync.badUrl");
      return false;
    }
    setHubUrl(url.value);
    ctx.engine.hubUrl = getHubUrl();
    return true;
  };
  const btn = h("button", { type: "button", class: "primary", onclick: async () => {
    if (!saveUrl()) return;
    msg.className = "muted";
    msg.textContent = t("sync.running");
    await runSync(ctx.engine);
    ctx.rerender();
  } }, t("sync.now"));

  const card = (c: ActionCard) => {
    const lbl = cardPatientLabel(c.patient_id, byId);
    return h(
      "li",
      { class: `card prio-${c.priority}` },
      h("strong", {}, `${t(`prio.${c.priority}` as const)} · ${c.title}`),
      lbl ? h("p", { class: "patient-chip" }, lbl.village ? t("sync.cardPatient", { name: lbl.name, v: lbl.village }) : t("sync.cardPatientId", { id: lbl.name })) : null,
      h("p", {}, c.summary),
      h("ol", {}, c.action_steps.map((s) => h("li", {}, s))),
      c.status === "OPEN"
        ? h("button", { type: "button", onclick: () => {
            void ctx.engine.enqueue({ event_type: "ACTION_CARD_ISSUED", patient_id: c.patient_id, payload: ackPayload(c) }).then(() => {
              ctx.syncSoon();
              ctx.rerender();
            });
          } }, t("cards.ack"))
        : h("span", { class: "muted" }, t("cards.acked")),
    );
  };

  let seen = false;
  const born = Date.now();
  const pendingEl = h("span", { class: "pending-count" }, String(pending));
  const hlcEl = h("code", { class: "hlc-code", lang: "en" }, proof.latestHlc);
  const eventCountEl = h("strong", {}, String(proof.eventCount));
  const syncStateEl = h("strong", {}, t(`proof.state.${proof.status}` as const));
  const proofCard = h(
    "section",
    { class: "proof-card", "data-proof": "crdt-node", "aria-label": t("proof.crdtTitle") },
    h("h2", {}, t("proof.crdtTitle")),
    h(
      "dl",
      { class: "proof-grid" },
      h("dt", {}, t("proof.nodeId")),
      h("dd", {}, h("code", { lang: "en" }, proof.nodeId)),
      h("dt", {}, t("proof.latestHlc")),
      h("dd", {}, hlcEl),
      h("dt", {}, t("proof.eventCount")),
      h("dd", {}, eventCountEl),
      h("dt", {}, t("proof.syncState")),
      h("dd", {}, syncStateEl),
    ),
  );
  const root = h(
    "section",
    {},
    h("h1", {}, t("sync.title")),
    field(t("sync.hubUrl"), url, auto ? t("sync.hubAuto", { u: auto }) : t("sync.hubHint")),
    btn,
    msg,
    h("p", {}, `${t("home.pendingSync")}: `, pendingEl),
    h("p", { class: "muted" }, last ? `${t("sync.last")}: ${new Date(last.at).toLocaleString()} — ${lastText}` : t("sync.never")),
    proofCard,
    h("h2", {}, t("cards.title")),
    cards.length ? h("ul", { class: "list" }, sortCards(cards).map(card)) : h("p", { class: "muted" }, t("cards.none")),
  );
  const refreshProof = () => {
    void ctx.store.getAllEvents().then((evts) => {
      const next = buildCrdtNodeProof(ctx.nodeId, evts, Number(pendingEl.textContent || 0), ctx.engine.status);
      hlcEl.textContent = next.latestHlc;
      eventCountEl.textContent = String(next.eventCount);
      syncStateEl.textContent = t(`proof.state.${next.status}` as const);
    });
  };
  // Live count + HLC proof in place (no remount, so `msg` survives); self-unsubscribes once this screen is gone.
  bindLiveCount(
    [
      (fn) => ctx.engine.events.on("status", (s) => fn(s.pendingCount)),
      (fn) => ctx.engine.events.on("enrichment", () => void ctx.engine.pendingCount().then(fn)),
    ],
    // Not yet mounted: keep listening up to 5s (rerender gap); once mounted then removed, or never mounted, drop.
    () => {
      if (root.isConnected) { seen = true; return true; }
      return !seen && Date.now() - born < 5000;
    },
    (n) => {
      pendingEl.textContent = String(n);
      refreshProof();
    },
  );
  return root;
}
