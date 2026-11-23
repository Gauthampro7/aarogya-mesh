import type { ChecklistType } from "../../clinical";
import { t } from "../../i18n";
import { checkbox, clear, field, h } from "../dom";
import type { Ctx } from "../ctx";
import { autoChecklistType, buildChecklistPayload, checklistItems, checklistTypes, evaluate } from "../checklist_logic";

export async function checklist(ctx: Ctx): Promise<HTMLElement> {
  const patients = await ctx.store.listPatients();
  const pSel = h("select", { name: "patient" }, h("option", { value: "" }, t("triage.anon")), patients.map((p) => h("option", { value: p.patient_id }, p.full_name)));
  const tSel = h("select", { name: "type" }, checklistTypes().map((c) => h("option", { value: c }, t(`ck.${c}` as const))));
  const done = new Set<string>();
  const list = h("div");
  const out = h("div", { "aria-live": "polite" });

  function drawItems() {
    clear(list);
    clear(out);
    const type = tSel.value as ChecklistType;
    done.clear();
    list.append(
      h("fieldset", {}, h("legend", {}, t(`ck.${type}` as const)), checklistItems(type).map((i) =>
        checkbox(i.critical ? `${i.label} *` : i.label, i.id, false, (c) => (c ? done.add(i.id) : done.delete(i.id))),
      )),
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
      .then(() => {
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
