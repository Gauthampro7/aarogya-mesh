import type { TriageAssessment, TriageSeverity } from "../../../../../packages/contracts/ts/index";
import { t } from "../../i18n";
import { h } from "../dom";

const SEV = {
  RED_EMERGENCY: { cls: "sev-red", icon: "⛔", title: "sev.red", sub: "sev.redSub" },
  YELLOW_PHC: { cls: "sev-yellow", icon: "▲", title: "sev.yellow", sub: "sev.yellowSub" },
  GREEN_HOME: { cls: "sev-green", icon: "✔", title: "sev.green", sub: "sev.greenSub" },
} as const satisfies Record<TriageSeverity, { cls: string; icon: string; title: string; sub: string }>;

/** Huge text + icon + colour banner. Never colour alone. Actions/rationale stay English (engine rules). */
export function renderTriageResult(a: TriageAssessment): HTMLElement {
  const s = SEV[a.severity];
  return h(
    "section",
    { class: `result ${s.cls}`, role: "alert", "aria-live": "assertive", tabindex: "-1", id: "triage-result" },
    h("div", { class: "banner" }, h("span", { class: "bigicon", "aria-hidden": "true" }, s.icon), h("div", {}, h("h2", {}, t(s.title)), h("p", {}, t(s.sub)))),
    a.severity === "RED_EMERGENCY"
      ? h("a", { class: "call108", href: "tel:108" }, "☎ ", t("sev.call108"))
      : null,
    a.referral_required ? h("p", { class: "referral" }, t(a.severity === "RED_EMERGENCY" ? "ref.red" : "ref.yellow")) : null,
    h("h3", {}, t("result.actions")),
    h("ul", {}, a.immediate_actions.map((x) => h("li", {}, x))),
    h("details", {}, h("summary", {}, t("result.why")), h("p", {}, a.rationale)),
  );
}
