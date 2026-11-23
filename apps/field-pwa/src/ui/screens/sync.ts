import type { ActionCard } from "../../../../../packages/contracts/ts/index";
import { t } from "../../i18n";
import { field, h } from "../dom";
import type { Ctx } from "../ctx";
import { runSync } from "../app_state";
import { clearHubUrl, getAutoHubOrigin, getHubUrl, getLastSync, isValidHubUrl, setHubUrl } from "../settings";
import { ackPayload, sortCards } from "../sync_logic";

export async function syncPanel(ctx: Ctx): Promise<HTMLElement> {
  const [pending, cards] = await Promise.all([ctx.engine.pendingCount(), ctx.store.listActionCards()]);
  const last = getLastSync();
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

  const card = (c: ActionCard) =>
    h(
      "li",
      { class: `card prio-${c.priority}` },
      h("strong", {}, `${t(`prio.${c.priority}` as const)} · ${c.title}`),
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

  return h(
    "section",
    {},
    h("h1", {}, t("sync.title")),
    field(t("sync.hubUrl"), url, t("sync.hubHint")),
    auto ? h("p", { class: "muted" }, t("sync.hubAuto", { u: auto })) : null,
    btn,
    msg,
    h("p", {}, `${t("home.pendingSync")}: ${pending}`),
    h("p", { class: "muted" }, last ? `${t("sync.last")}: ${new Date(last.at).toLocaleString()} — ${last.ok ? t("sync.ok") : t("sync.fail", { s: last.detail })}` : t("sync.never")),
    h("h2", {}, t("cards.title")),
    cards.length ? h("ul", { class: "list" }, sortCards(cards).map(card)) : h("p", { class: "muted" }, t("cards.none")),
  );
}
