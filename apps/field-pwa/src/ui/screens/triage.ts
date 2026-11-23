import { evaluateTriage, evaluateWatchRapidTriage } from "../../clinical";
import type { PatientCategory } from "../../clinical";
import type { PatientRecord } from "../../core";
import { t, tx } from "../../i18n";
import { checkbox, clear, field, h } from "../dom";
import type { Ctx } from "../ctx";
import {
  VITAL_SPECS,
  applyCategory,
  flagLabel,
  buildTriageInput,
  dehydrationFlags,
  maternalRedOptions,
  maternalYellowOptions,
  patientAgeMonths,
  pediatricDangerOptions,
  suggestCategory,
  type FlagOption,
  type NumField,
  type NumError,
  type TriageFormState,
} from "../triage_map";
import { renderTriageResult } from "./triage_result";
import type { TriageAssessment } from "../../../../../packages/contracts/ts/index";

const NUM_LABEL: Record<NumField, Parameters<typeof t>[0]> = {
  temperature_c: "v.temp",
  spo2_pct: "v.spo2",
  respiratory_rate_bpm: "v.rr",
  systolic_bp: "v.sys",
  diastolic_bp: "v.dia",
  hemoglobin_g_dl: "v.hb",
  muac_cm: "v.muac",
  age_months: "v.ageMonths",
  gestational_weeks: "v.weeks",
  fever_days: "v.feverDays",
  diarrhea_days: "v.diarrheaDays",
};

export async function triage(ctx: Ctx, params: string[]): Promise<HTMLElement> {
  const patients = await ctx.store.listPatients();
  const preset = params[0] ? patients.find((p) => p.patient_id === params[0]) : undefined;
  const st: TriageFormState = {
    category: preset ? suggestCategory(preset) : null,
    patientId: preset?.patient_id ?? null,
    nums: {},
    isPregnant: preset?.is_pregnant ?? false,
    isPostpartum: false,
    dangerFlags: [],
    symptomFlags: [],
    dehydrationFlags: [],
    cough: false,
    chestIndrawing: false,
    diarrhea: false,
    bloodInStool: false,
    edema: false,
    pallor: false,
    malariaRdt: false,
  };
  if (preset) {
    const m = patientAgeMonths(preset);
    if (m !== null) st.nums.age_months = String(m);
    if (preset.gestational_weeks !== null) st.nums.gestational_weeks = String(preset.gestational_weeks);
  }

  const resultBox = h("div", { "aria-live": "assertive" });
  const errBox = h("div", { class: "error", role: "alert" });
  const formBox = h("div");

  const patientSel = h(
    "select",
    { name: "patient" },
    h("option", { value: "" }, t("triage.anon")),
    patients.map((p) => h("option", { value: p.patient_id, selected: p.patient_id === st.patientId }, p.full_name)),
  );
  const catSel = h(
    "select",
    { name: "category" },
    (["PEDIATRIC", "MATERNAL", "GENERAL"] as PatientCategory[]).map((c) =>
      h("option", { value: c, selected: c === st.category }, t(`cat.${c}` as const)),
    ),
  );
  catSel.prepend(h("option", { value: "", selected: st.category === null }, t("triage.chooseCat")));
  const noteBox = h("div", { class: "error", role: "alert" });
  const setCategory = (c: PatientCategory | null) => {
    const { cleared } = applyCategory(st, c);
    clear(noteBox);
    if (cleared.length) noteBox.append(h("p", {}, t("triage.cleared", { list: cleared.map(flagLabel).join("; ") })));
    catSel.value = c ?? "";
    drawForm();
  };
  patientSel.addEventListener("change", () => {
    st.patientId = patientSel.value || null;
    const p: PatientRecord | undefined = patients.find((x) => x.patient_id === st.patientId);
    if (p) {
      st.isPregnant = p.is_pregnant;
      const m = patientAgeMonths(p);
      if (m !== null) st.nums.age_months = String(m);
      if (p.gestational_weeks !== null) st.nums.gestational_weeks = String(p.gestational_weeks);
      setCategory(suggestCategory(p));
    }
  });
  catSel.addEventListener("change", () => {
    setCategory((catSel.value || null) as PatientCategory | null);
  });

  const numField = (f: NumField) => {
    const spec = VITAL_SPECS[f];
    const i = h("input", {
      type: "number",
      name: f,
      min: spec.min,
      max: spec.max,
      step: spec.step,
      inputmode: spec.integer ? "numeric" : "decimal",
      value: st.nums[f] ?? "",
    });
    i.addEventListener("input", () => (st.nums[f] = i.value));
    return field(t(NUM_LABEL[f]), i, `${spec.min}–${spec.max}`);
  };

  const flagGroup = (title: string, opts: FlagOption[], into: string[]) =>
    h(
      "fieldset",
      {},
      h("legend", {}, title),
      opts.map((o) =>
        checkbox(o.label, o.flag, into.includes(o.flag), (c) => {
          const i = into.indexOf(o.flag);
          if (c && i < 0) into.push(o.flag);
          if (!c && i >= 0) into.splice(i, 1);
        }),
      ),
    );
  const bool = (label: string, key: keyof TriageFormState) =>
    checkbox(label, String(key), st[key] as boolean, (c) => ((st[key] as boolean) = c));

  function drawForm() {
    clear(formBox);
    const rb = document.getElementById("run-triage") as HTMLButtonElement | null;
    if (rb) rb.disabled = st.category === null;
    if (st.category === null) {
      formBox.append(h("p", { class: "error", role: "alert" }, t("triage.pickCategory")));
    } else if (st.category === "PEDIATRIC") {
      formBox.append(
        flagGroup(t("triage.dangerSigns"), pediatricDangerOptions(), st.dangerFlags),
        h("fieldset", {}, h("legend", {}, t("triage.symptoms")), bool(t("s.cough"), "cough"), bool(t("s.indrawing"), "chestIndrawing"), bool(t("s.diarrhea"), "diarrhea"), bool(t("s.blood"), "bloodInStool"), bool(t("s.edema"), "edema"), bool(t("s.pallor"), "pallor"), bool(t("s.rdt"), "malariaRdt")),
        flagGroup(
          t("triage.dehydration"),
          dehydrationFlags().map((f) => ({ flag: f, label: tx(`dehy.${f}`, f) })),
          st.dehydrationFlags,
        ),
        h("div", { class: "grid2" }, numField("age_months"), numField("fever_days"), numField("diarrhea_days"), numField("muac_cm")),
      );
    } else if (st.category === "MATERNAL") {
      formBox.append(
        h("fieldset", {}, h("legend", {}, t("triage.maternalStatus")), bool(t("reg.pregnant"), "isPregnant"), bool(t("triage.postpartum"), "isPostpartum")),
        flagGroup(t("triage.dangerSigns"), pediatricDangerOptions(), st.dangerFlags),
        flagGroup(t("triage.maternalDanger"), maternalRedOptions(), st.dangerFlags),
        flagGroup(t("triage.watchSigns"), maternalYellowOptions(), st.symptomFlags),
        h("div", { class: "grid2" }, numField("gestational_weeks"), numField("hemoglobin_g_dl")),
      );
    } else {
      formBox.append(flagGroup(t("triage.dangerSigns"), pediatricDangerOptions(), st.dangerFlags), h("div", { class: "grid2" }, numField("age_months"), numField("fever_days")));
    }
    if (st.category !== null) formBox.append(
      h("div", { class: "grid2" }, numField("temperature_c"), numField("spo2_pct"), numField("respiratory_rate_bpm"), st.category === "MATERNAL" || st.category === "GENERAL" ? numField("systolic_bp") : null, st.category === "MATERNAL" || st.category === "GENERAL" ? numField("diastolic_bp") : null),
    );
  }
  drawForm();

  const errText = (e: NumError) => {
    const s = VITAL_SPECS[e.field];
    return t(e.reason === "NaN" ? "err.nan" : e.reason === "integer" ? "err.int" : "err.range", { f: t(NUM_LABEL[e.field]), min: s.min, max: s.max });
  };

  /** Show the engine's result immediately, then persist locally (log + outbox). */
  function show(a: TriageAssessment) {
    clear(errBox);
    clear(resultBox);
    resultBox.append(renderTriageResult(a));
    const saved = h("p", { class: "muted", role: "status" }, t("triage.saving"));
    resultBox.append(saved);
    (document.getElementById("triage-result") as HTMLElement | null)?.focus();
    ctx.engine
      .enqueue({ event_type: "TRIAGE_COMPLETED", patient_id: a.patient_id, payload: { ...a } })
      .then(() => {
        saved.textContent = t("triage.saved");
        ctx.syncSoon();
      })
      .catch((e) => {
        saved.className = "error";
        saved.textContent = `${t("triage.saveFail")} ${String(e)}`;
      });
  }

  const runBtn = h("button", { type: "button", class: "primary", id: "run-triage", disabled: st.category === null, onclick: () => {
    clear(errBox);
    clear(resultBox);
    const r = buildTriageInput(st);
    if (!r.ok) {
      if (r.needsCategory) errBox.append(h("p", {}, t("triage.pickCategory")));
      if (r.hiddenFlags) errBox.append(h("p", {}, t("triage.hiddenFlags")));
      errBox.append(h("ul", {}, [...r.errors.map((e) => h("li", {}, errText(e))), r.message ? h("li", {}, r.message) : null]));
      return;
    }
    try {
      show(evaluateTriage(r.input));
    } catch (e) {
      errBox.append(h("p", {}, e instanceof Error ? e.message : String(e)));
    }
  } }, t("triage.run"));

  // One-tap fast path: engine classifies (RED via the canonical danger-sign floor).
  const fastBtn = h("button", { type: "button", class: "bigbtn danger fast", onclick: () => {
    try {
      show(evaluateWatchRapidTriage(["lethargic_or_unconscious"], { patient_id: st.patientId, assessed_at_ms: Date.now() }));
    } catch (e) {
      errBox.append(h("p", {}, e instanceof Error ? e.message : String(e)));
    }
  } }, h("span", { "aria-hidden": "true", class: "ico" }, "⛔"), h("span", {}, t("triage.fast")));

  return h("section", {}, h("h1", {}, t("triage.title")), fastBtn, field(t("triage.patient"), patientSel), field(t("triage.category"), catSel), noteBox, formBox, errBox, runBtn, resultBox);
}
