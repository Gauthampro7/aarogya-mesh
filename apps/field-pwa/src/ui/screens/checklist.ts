import type { ChecklistType } from "../../clinical";
import { t, tx } from "../../i18n";
import { checkbox, clear, field, h } from "../dom";
import type { Ctx } from "../ctx";
import { autoChecklistType, buildChecklistPayload, checklistItems, checklistTypes, evaluate, latestCompletedChecks } from "../checklist_logic";

export async function checklist(ctx: Ctx): Promise<HTMLElement> {
  const [patients, events] = await Promise.all([ctx.store.listPatients(), ctx.store.getAllEvents()]);
  const pSel = h("select", { name: "patient" }, h("option", { value: "" }, t("triage.anon")), patients.map((p) => h("option", { value: p.patient_id }, p.full_name)));
  const tSel = h("select", { name: "type" }, checklistTypes().map((c) => h("option", { value: c }, t(`ck.${c}` as const))));
  const done = new Set<string>();
  const list = h("div");
  const out = h("div", { "aria-live": "polite" });

  function drawItems() {
    clear(list);
    clear(out);
    const type = tSel.value as ChecklistType;
    const items = checklistItems(type);
    done.clear();
    for (const id of latestCompletedChecks(events, pSel.value || null, type)) if (items.some((i) => i.id === id)) done.add(id);
    const count = h("p", { class: "ckcount", "aria-live": "polite" });
    const recount = () => (count.textContent = t("ck.score", { done: done.size, total: items.length }));
    recount();
    list.append(
      h("fieldset", {}, h("legend", {}, t(`ck.${type}` as const)), items.map((i) =>
        checkbox(i.critical ? `${tx(`cki.${i.id}`, i.label)} *` : tx(`cki.${i.id}`, i.label), i.id, done.has(i.id), (c) => {
          if (c) done.add(i.id);
          else done.delete(i.id);
          recount();
        }),
      )),
      count,
      ...(done.size ? [h("p", { class: "muted" }, t("ck.prefilled"))] : []),
      h("p", { class: "muted" }, t("ck.criticalNote")),
      h("button", { type: "button", class: "primary", onclick: save }, t("ck.save")),
    );
  }
  function save() {
    clear(out);
    const type = tSel.value as ChecklistType;
    const pid = pSel.value || null;
    const ev = evaluate(type, [...done], pid);
    out.append(
      h("h2", {}, t("ck.score", { done: ev.completed_items.length, total: ev.total_items })),
      ev.has_critical_gaps
        ? h("div", { class: "result sev-yellow", role: "alert" }, h("h3", {}, "▲ ", t("ck.escalate")), h("ul", {}, ev.action_cards.filter((c) => c.priority === "HIGH").map((c) => h("li", {}, h("strong", {}, c.title), h("div", {}, c.action_steps.join(" "))))))
        : h("div", { class: "result sev-green", role: "status" }, h("h3", {}, "✔ ", t("ck.noGaps"))),
    );
    const saved = h("p", { class: "muted", role: "status" }, t("triage.saving"));
    out.append(saved);
    ctx.engine
      .enqueue({ event_type: "CHECKLIST_RECORDED", patient_id: pid, payload: buildChecklistPayload(ev) })
      .then((rec) => {
        events.push(rec);
        saved.textContent = t("ck.saved");
        ctx.syncSoon();
      })
      .catch((e) => {
        saved.className = "error";
        saved.textContent = String(e);
      });
  }
  pSel.addEventListener("change", () => {
    const p = patients.find((x) => x.patient_id === pSel.value);
    const auto = p?.is_pregnant ? autoChecklistType(p.gestational_weeks) : null;
    if (auto) tSel.value = auto;
    drawItems();
  });
  tSel.addEventListener("change", drawItems);
  drawItems();
  return h("section", {}, h("h1", {}, t("ck.title")), field(t("triage.patient"), pSel), field(t("ck.type"), tSel, t("ck.autoHint")), list, out);
}
