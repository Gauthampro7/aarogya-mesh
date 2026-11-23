/**
 * Triage input model, flag alias normalisation and validation.
 *
 * Mirrors `TriageInput` / `_FLAG_ALIASES` / `_normalize_flag` in
 * `packages/clinical-engine/src/aarogya_clinical_engine/triage.py` (commit 53c61b2).
 */

export type TriageMode = "FULL_ASSESSMENT" | "WATCH_RAPID";
export type PatientCategory = "PEDIATRIC" | "MATERNAL" | "GENERAL";

export interface TriageInput {
  patient_id?: string | null;
  mode?: TriageMode;
  patient_category?: PatientCategory | null;
  age_months?: number | null;
  is_pregnant?: boolean;
  is_postpartum?: boolean;
  gestational_weeks?: number | null;
  danger_signs?: string[];
  symptoms?: string[];
  temperature_c?: number | null;
  respiratory_rate_bpm?: number | null;
  spo2_pct?: number | null;
  systolic_bp?: number | null;
  diastolic_bp?: number | null;
  hemoglobin_g_dl?: number | null;
  muac_cm?: number | null;
  has_cough_or_difficult_breathing?: boolean;
  chest_indrawing?: boolean;
  has_diarrhea?: boolean;
  diarrhea_days?: number;
  blood_in_stool?: boolean;
  dehydration_signs?: string[];
  fever_days?: number;
  bilateral_pedal_edema?: boolean;
  palmar_pallor?: boolean;
  malaria_rdt_positive?: boolean;
  assessed_at_ms?: number | null;
}

export const FLAG_ALIASES: Readonly<Record<string, string>> = {
  unable_to_drink: "not_able_to_drink_or_breastfeed",
  unable_to_drink_or_breastfeed: "not_able_to_drink_or_breastfeed",
  cannot_drink: "not_able_to_drink_or_breastfeed",
  cannot_breastfeed: "not_able_to_drink_or_breastfeed",
  vomiting_everything: "vomits_everything",
  persistent_vomiting_all: "vomits_everything",
  seizures: "convulsions",
  fits: "convulsions",
  lethargic: "lethargic_or_unconscious",
  unconscious: "lethargic_or_unconscious",
  abnormally_sleepy: "lethargic_or_unconscious",
  severe_chest_indrawing: "severe_breathing_difficulty",
  gasping: "severe_breathing_difficulty",
  bluish_lips: "cyanosis",
  central_cyanosis: "cyanosis",
  stridor: "stridor_in_calm_child",
  bulging_fontanelle: "stiff_neck",
  severe_headache: "severe_headache_or_blurred_vision",
  blurred_vision: "severe_headache_or_blurred_vision",
  visual_disturbance: "severe_headache_or_blurred_vision",
  eclampsia: "convulsions_or_fits",
  pph: "vaginal_bleeding",
  antepartum_bleeding: "vaginal_bleeding",
  postpartum_bleeding: "vaginal_bleeding",
  absent_fetal_movement: "reduced_fetal_movement",
  decreased_fetal_movement: "reduced_fetal_movement",
  reduced_or_absent_fetal_movement: "reduced_fetal_movement",
  prom: "leaking_fluid_before_labor",
  water_breaking: "leaking_fluid_before_labor",
  epigastric_pain: "severe_abdominal_pain",
  severe_pallor: "severe_anemia_signs",
  facial_swelling: "swelling_face_and_hands",
  chest_pain: "breathing_difficulty_or_chest_pain",
};

/** Python `_normalize_flag`: strip, lowercase, `-`/space to `_`, then alias lookup. */
export function normalizeFlag(flag: string): string {
  const cleaned = flag.trim().toLowerCase().replaceAll("-", "_").replaceAll(" ", "_");
  return Object.prototype.hasOwnProperty.call(FLAG_ALIASES, cleaned) ? FLAG_ALIASES[cleaned] : cleaned;
}

type NumSpec = [key: keyof TriageInput, min: number, max: number, integer: boolean];

const NULLABLE_NUMS: NumSpec[] = [
  ["age_months", 0, 1500, true],
  ["gestational_weeks", 0, 45, true],
  ["temperature_c", 30.0, 45.0, false],
  ["respiratory_rate_bpm", 0, 160, true],
  ["spo2_pct", 0, 100, true],
  ["systolic_bp", 40, 300, true],
  ["diastolic_bp", 20, 200, true],
  ["hemoglobin_g_dl", 1.0, 25.0, false],
  ["muac_cm", 5.0, 50.0, false],
  ["assessed_at_ms", 0, Number.MAX_SAFE_INTEGER, true],
];
const COUNT_NUMS: NumSpec[] = [
  ["diarrhea_days", 0, 365, true],
  ["fever_days", 0, 365, true],
];
const BOOLS = [
  "is_pregnant",
  "is_postpartum",
  "has_cough_or_difficult_breathing",
  "chest_indrawing",
  "has_diarrhea",
  "blood_in_stool",
  "bilateral_pedal_edema",
  "palmar_pallor",
  "malaria_rdt_positive",
] as const;
const LISTS = ["danger_signs", "symptoms", "dehydration_signs"] as const;
const KNOWN_KEYS = new Set<string>([
  "patient_id",
  "mode",
  "patient_category",
  ...NULLABLE_NUMS.map((s) => s[0]),
  ...COUNT_NUMS.map((s) => s[0]),
  ...BOOLS,
  ...LISTS,
]);

function fail(msg: string): never {
  throw new Error(`Invalid TriageInput: ${msg}`);
}

function checkNum(key: string, v: unknown, min: number, max: number, integer: boolean): number {
  if (typeof v !== "number" || !Number.isFinite(v)) fail(`${key} must be a number`);
  if (integer && !Number.isInteger(v)) fail(`${key} must be an integer`);
  if (v < min || v > max) fail(`${key} must be between ${min} and ${max}`);
  return v;
}

/**
 * Validate and fill defaults, mirroring the pydantic `TriageInput` model
 * (`extra="forbid"`, field ranges). Throws `Error` on invalid input.
 */
export function validateTriageInput(input: TriageInput): Required<TriageInput> {
  const raw = input as Record<string, unknown>;
  for (const key of Object.keys(raw)) if (!KNOWN_KEYS.has(key)) fail(`unknown field ${key}`);

  const pid = raw.patient_id ?? null;
  if (pid !== null && (typeof pid !== "string" || pid.length < 1 || pid.length > 128)) {
    fail("patient_id must be a 1-128 character string");
  }
  const mode = raw.mode ?? "FULL_ASSESSMENT";
  if (mode !== "FULL_ASSESSMENT" && mode !== "WATCH_RAPID") fail("mode is invalid");
  const cat = raw.patient_category ?? null;
  if (cat !== null && cat !== "PEDIATRIC" && cat !== "MATERNAL" && cat !== "GENERAL") {
    fail("patient_category is invalid");
  }

  const out: Record<string, unknown> = { patient_id: pid, mode, patient_category: cat };
  for (const [key, min, max, integer] of NULLABLE_NUMS) {
    const v = raw[key] ?? null;
    out[key] = v === null ? null : checkNum(key, v, min, max, integer);
  }
  for (const [key, min, max, integer] of COUNT_NUMS) {
    out[key] = checkNum(key, raw[key] ?? 0, min, max, integer);
  }
  for (const key of BOOLS) {
    const v = raw[key] ?? false;
    if (typeof v !== "boolean") fail(`${key} must be a boolean`);
    out[key] = v;
  }
  for (const key of LISTS) {
    const v = raw[key] ?? [];
    if (!Array.isArray(v) || v.some((s) => typeof s !== "string")) fail(`${key} must be a string array`);
    out[key] = [...v];
  }
  return out as Required<TriageInput>;
}
