import type { TriageAssessment, TriageSeverity } from "../../../../../packages/contracts/ts/index";
import { getLang, t, type Lang } from "../../i18n";
import { HI_TRIAGE_ACTIONS, HI_TRIAGE_RATIONALE } from "../../i18n/hi";
import { h } from "../dom";

const SEV = {
  RED_EMERGENCY: { cls: "sev-red", icon: "⛔", title: "sev.red", sub: "sev.redSub" },
  YELLOW_PHC: { cls: "sev-yellow", icon: "▲", title: "sev.yellow", sub: "sev.yellowSub" },
  GREEN_HOME: { cls: "sev-green", icon: "✔", title: "sev.green", sub: "sev.greenSub" },
} as const satisfies Record<TriageSeverity, { cls: string; icon: string; title: string; sub: string }>;

/** Display-only Hindi for an engine action string; the stored English is never changed. */
export function localizeTriageAction(text: string, lang: Lang = getLang()): string {
  return lang === "hi" ? (HI_TRIAGE_ACTIONS[text] ?? text) : text;
}

/** Display-only Hindi rationale built from matched rule ids; any unknown id keeps the English. */
export function localizeTriageRationale(text: string, matchedRules: readonly string[], lang: Lang = getLang()): string {
  if (lang !== "hi" || matchedRules.length === 0) return text;
  const out: string[] = [];
  for (const id of matchedRules) {
    const hiText = HI_TRIAGE_RATIONALE[id];
    if (hiText === undefined) return text;
    if (!out.includes(hiText)) out.push(hiText);
  }
  return out.join(" ");
}

/** Haptic alert via the Android shell, if present. Never throws. */
export function vibrateIfEmergency(severity: TriageSeverity, g: unknown = globalThis): void {
  if (severity !== "RED_EMERGENCY") return;
  try {
    (g as { AarogyaNativeBridge?: { vibrateEmergency?: () => void } }).AarogyaNativeBridge?.vibrateEmergency?.();
  } catch {
    /* ignore */
  }
}

export interface SafetyFloorProof {
  executionTarget: string;
  confidence: string;
  matchedRules: readonly string[];
}

/** Pure proof metadata surfaced on every triage result card (0 network calls). */
export function buildSafetyFloorProof(a: TriageAssessment): SafetyFloorProof {
  return {
    executionTarget: a.execution_target,
    confidence: a.confidence.toFixed(2),
    matchedRules: a.matched_rules,
  };
}

/**
 * Huge text + icon + colour banner. Never colour alone. Actions/rationale are shown localized
 * (display only); the stored TriageAssessment keeps the engine's English strings.
 */
export function renderTriageResult(a: TriageAssessment): HTMLElement {
  const s = SEV[a.severity];
  vibrateIfEmergency(a.severity);
  const why = localizeTriageRationale(a.rationale, a.matched_rules);
  const proof = buildSafetyFloorProof(a);
  return h(
    "section",
    { class: `result ${s.cls}`, role: "alert", "aria-live": "assertive", tabindex: "-1", id: "triage-result" },
    h("div", { class: "banner" }, h("span", { class: "bigicon", "aria-hidden": "true" }, s.icon), h("div", {}, h("h2", {}, t(s.title)), h("p", {}, t(s.sub)))),
    a.severity === "RED_EMERGENCY"
      ? h("a", { class: "call108", href: "tel:108" }, "☎ ", t("sev.call108"))
      : null,
    a.referral_required ? h("p", { class: "referral" }, t(a.severity === "RED_EMERGENCY" ? "ref.red" : "ref.yellow")) : null,
    h(
      "div",
      { class: "proof-strip", "data-proof": "safety-floor" },
      h(
        "div",
        { class: "proof-pills" },
        h("span", { class: "proof-pill" }, t("proof.localDeterministic")),
        h("span", { class: "proof-pill" }, t("proof.confidence", { val: proof.confidence })),
        h("span", { class: "proof-pill" }, t("proof.zeroNetwork")),
      ),
      proof.matchedRules.length > 0
        ? h(
            "div",
            { class: "proof-rules" },
            h("span", { class: "proof-label" }, `${t("proof.matchedRules")}:`),
            ...proof.matchedRules.map((id) => h("code", { class: "rule-badge", lang: "en" }, id)),
          )
        : null,
    ),
    h("h3", {}, t("result.actions")),
    h("ul", {}, a.immediate_actions.map((x) => h("li", {}, localizeTriageAction(x)))),
    h(
      "details",
      {},
      h("summary", {}, t("result.why")),
      h("p", {}, why),
      why !== a.rationale ? h("p", { class: "orig-en", lang: "en" }, h("small", {}, `${t("result.originalEn")}: ${a.rationale}`)) : null,
    ),
  );
}
