import { t } from "../../i18n";
import { h } from "../dom";
import type { Ctx } from "../ctx";
import { patientAgeMonths } from "../triage_map";

export async function home(ctx: Ctx): Promise<HTMLElement> {
  const [pending, enrich, patients, events] = await Promise.all([
    ctx.engine.pendingCount(),
    ctx.engine.pendingEnrichmentCount(),
    ctx.store.listPatients(),
    ctx.store.getAllEvents(),
  ]);
  // Today's queue: patients registered or assessed by a local event today, newest first.
  const dayStart = new Date().setHours(0, 0, 0, 0);
  const touched = new Map<string, number>();
  for (const e of events) {
    if (e.patient_id && e.hlc.wall_ms >= dayStart) touched.set(e.patient_id, Math.max(touched.get(e.patient_id) ?? 0, e.hlc.wall_ms));
  }
  const queue = patients.filter((p) => touched.has(p.patient_id)).sort((a, b) => touched.get(b.patient_id)! - touched.get(a.patient_id)!);

  const nav = (href: string, icon: string, key: Parameters<typeof t>[0], cls = "") =>
    h("a", { class: `bigbtn ${cls}`, href }, h("span", { "aria-hidden": "true", class: "ico" }, icon), h("span", {}, t(key)));

  return h(
    "section",
    {},
    h("h1", {}, t("home.title")),
    h(
      "div",
      { class: "stats", role: "group", "aria-label": t("home.status") },
      h("div", { class: "stat" }, h("strong", {}, String(pending)), h("span", {}, t("home.pendingSync"))),
      h("div", { class: "stat" }, h("strong", {}, String(enrich)), h("span", {}, t("home.pendingEnrich"))),
      h("div", { class: "stat" }, h("strong", {}, String(patients.length)), h("span", {}, t("home.patients"))),
    ),
    h(
      "div",
      { class: "navgrid" },
      nav("#/triage", "⚠", "nav.triage", "danger"),
      nav("#/register", "＋", "nav.register"),
      nav("#/vaccines", "💉", "nav.vaccines"),
      nav("#/checklist", "☑", "nav.checklist"),
      nav("#/voice", "🎤", "nav.voice"),
      nav("#/sync", "⇅", "nav.sync"),
    ),
    h("h2", {}, t("home.queue")),
    queue.length === 0
      ? h("p", { class: "muted" }, t("home.queueEmpty"))
      : h(
          "ul",
          { class: "list" },
          queue.map((p) => {
            const m = patientAgeMonths(p);
            return h(
              "li",
              {},
              h("a", { href: `#/triage/${encodeURIComponent(p.patient_id)}` }, h("strong", {}, p.full_name), " ", h("span", { class: "muted" }, m === null ? "" : t("age.months", { n: m }))),
            );
          }),
        ),
  );
}
