/**
 * Deterministic Tier-0 Watch 1-tap WHO IMNCI & NHM Maternal Danger-Sign Screener.
 *
 * Clinical Safety Floor:
 * - Zero network calls; executes 100% locally.
 * - Any single checked pediatric or maternal danger sign deterministically forces:
 *   `severity = "RED_EMERGENCY"`, `referral_required = true`, `confidence = 1.0`,
 *   `execution_target = "LOCAL_DETERMINISTIC"`.
 * - Emits a strict `TriageAssessment`-conformant `TRIAGE_COMPLETED` payload with
 *   ONLY the exact keys allowed by `packages/contracts` (`extra="forbid"`).
 * - On `RED_EMERGENCY`, emits a companion `ACTION_CARD_ISSUED` event
 *   (`priority: "CRITICAL"`, `target_tier: "TIER_0_WATCH"`).
 */

import {
  ActionCard,
  CrdtEvent,
  HlcTimestamp,
  TriageAssessment,
  TriageSeverity,
  WatchMode,
} from "../../../../packages/contracts/ts/index";

export type WatchDangerCategory = "PEDIATRIC" | "MATERNAL";

export type WatchDangerSignFlag =
  | "not_able_to_drink_or_breastfeed"
  | "vomits_everything"
  | "convulsions"
  | "lethargic_or_unconscious"
  | "severe_respiratory_distress"
  | "cyanosis"
  | "stridor_in_calm_child"
  | "stiff_neck"
  | "severe_bleeding"
  | "very_high_fever"
  | "vaginal_bleeding"
  | "severe_headache_or_blurred_vision"
  | "convulsions_or_fits"
  | "reduced_fetal_movement"
  | "high_fever"
  | "severe_anemia_signs"
  | "severe_abdominal_pain"
  | "leaking_fluid_before_labor"
  | "swelling_face_and_hands"
  | "breathing_difficulty_or_chest_pain";

export interface WatchDangerSignDefinition {
  readonly flag: WatchDangerSignFlag;
  readonly ruleId: string;
  readonly category: WatchDangerCategory;
  readonly labelEn: string;
  readonly labelHi: string;
  readonly immediateActions: readonly string[];
  readonly rationale: string;
}

export const WATCH_PROTOCOL_SOURCE = "WHO_IMNCI_ASHA_WATCH_RAPID" as const;

export const ALLOWED_TRIAGE_ASSESSMENT_KEYS = [
  "assessment_id",
  "patient_id",
  "severity",
  "matched_rules",
  "immediate_actions",
  "referral_required",
  "rationale",
  "confidence",
  "protocol_source",
  "execution_target",
  "assessed_at_ms",
] as const;

export const WATCH_DANGER_SIGNS: readonly WatchDangerSignDefinition[] = [
  {
    flag: "not_able_to_drink_or_breastfeed",
    ruleId: "IMNCI_GDS_01",
    category: "PEDIATRIC",
    labelEn: "Unable to drink or breastfeed",
    labelHi: "पेय अथवा स्तनपान करने में असमर्थ",
    immediateActions: [
      "Immediate 108 emergency referral to PHC/FRU",
      "Keep child warm and prevent hypoglycemia during transport",
    ],
    rationale:
      "WHO IMNCI General Danger Sign: inability to drink or breastfeed indicates critical systemic illness.",
  },
  {
    flag: "vomits_everything",
    ruleId: "IMNCI_GDS_02",
    category: "PEDIATRIC",
    labelEn: "Vomits everything",
    labelHi: "प्रत्येक आहार पर वमन",
    immediateActions: [
      "Immediate 108 emergency referral to PHC/FRU",
      "Offer small frequent sips of ORS if conscious during transport",
    ],
    rationale:
      "WHO IMNCI General Danger Sign: persistent vomiting prevents oral rehydration and medication.",
  },
  {
    flag: "convulsions",
    ruleId: "IMNCI_GDS_03",
    category: "PEDIATRIC",
    labelEn: "Convulsions",
    labelHi: "आक्षेप",
    immediateActions: [
      "Place child in left lateral recovery position and keep airway clear",
      "Do NOT put anything in the mouth",
      "Immediate 108 emergency referral to PHC/FRU",
    ],
    rationale:
      "WHO IMNCI General Danger Sign: convulsions indicate possible meningitis, cerebral malaria, or severe metabolic emergency.",
  },
  {
    flag: "lethargic_or_unconscious",
    ruleId: "IMNCI_GDS_04",
    category: "PEDIATRIC",
    labelEn: "Lethargic or unconscious",
    labelHi: "अत्यंत शिथिल अथवा अचेत",
    immediateActions: [
      "Check airway and breathing; position safely on side",
      "Immediate 108 emergency referral to PHC/FRU",
      "Prevent hypothermia with skin-to-skin warmth or blanket",
    ],
    rationale:
      "WHO IMNCI General Danger Sign: altered consciousness indicates critical neurological or circulatory compromise.",
  },
  {
    flag: "severe_respiratory_distress",
    ruleId: "IMNCI_GDS_05",
    category: "PEDIATRIC",
    labelEn: "Severe respiratory distress",
    labelHi: "तीव्र श्वास कष्ट",
    immediateActions: [
      "Keep child calm and upright; clear nasal passages gently",
      "Immediate 108 emergency referral to oxygen-equipped PHC/FRU",
    ],
    rationale:
      "WHO IMNCI Severe Respiratory Distress: high risk of hypoxemia and respiratory failure.",
  },
  {
    flag: "cyanosis",
    ruleId: "IMNCI_GDS_06",
    category: "PEDIATRIC",
    labelEn: "Bluish lips or tongue (cyanosis)",
    labelHi: "ओष्ठ अथवा जिह्वा का नीलवर्ण",
    immediateActions: [
      "Immediate 108 emergency referral to oxygen-equipped PHC/FRU",
      "Maintain open airway and keep child calm and warm",
    ],
    rationale: "Central cyanosis indicates life-threatening hypoxemia.",
  },
  {
    flag: "stridor_in_calm_child",
    ruleId: "IMNCI_GDS_07",
    category: "PEDIATRIC",
    labelEn: "Stridor in a calm child",
    labelHi: "शांत शिशु में कर्कश श्वास ध्वनि",
    immediateActions: [
      "Keep child calm in caregiver's lap; avoid unnecessary agitation",
      "Immediate 108 emergency referral to PHC/FRU for airway management",
    ],
    rationale:
      "WHO IMNCI Severe Pneumonia / Upper Airway Obstruction: stridor at rest risks acute airway closure.",
  },
  {
    flag: "stiff_neck",
    ruleId: "IMNCI_GDS_08",
    category: "PEDIATRIC",
    labelEn: "Stiff neck or bulging fontanelle",
    labelHi: "ग्रीवा स्तंभता",
    immediateActions: [
      "Immediate 108 emergency referral to FRU/District Hospital for suspected meningitis",
      "Give first pre-referral dose of antibiotic per ANM/MO standing order if available",
    ],
    rationale:
      "WHO IMNCI Very Severe Febrile Disease: stiff neck is a hallmark sign of acute meningitis.",
  },
  {
    flag: "severe_bleeding",
    ruleId: "IMNCI_GDS_09",
    category: "PEDIATRIC",
    labelEn: "Severe bleeding",
    labelHi: "अत्यधिक रक्तस्राव",
    immediateActions: [
      "Apply direct clean pressure if external bleeding",
      "Immediate 108 emergency referral to FRU/District Hospital",
    ],
    rationale:
      "Active hemorrhage or hemorrhagic fever requires urgent hospital stabilization.",
  },
  {
    flag: "very_high_fever",
    ruleId: "IMNCI_GDS_10",
    category: "PEDIATRIC",
    labelEn: "Very high fever",
    labelHi: "अति उच्च ज्वर",
    immediateActions: [
      "Begin tepid sponging and administer age-appropriate paracetamol if able to swallow",
      "Immediate 108 emergency referral to PHC/FRU for severe febrile illness evaluation",
    ],
    rationale:
      "Hyperpyrexia carries high risk of febrile seizures, sepsis, or cerebral malaria.",
  },
  {
    flag: "vaginal_bleeding",
    ruleId: "MAT_RED_03",
    category: "MATERNAL",
    labelEn: "Vaginal bleeding",
    labelHi: "योनि से रक्तस्राव",
    immediateActions: [
      "Immediate 108 emergency referral to FRU/District Hospital",
      "Keep mother lying flat on left side with legs elevated; arrange blood donor contact",
      "Do NOT perform vaginal examination in field setting",
    ],
    rationale:
      "Antepartum or postpartum hemorrhage is a leading cause of maternal mortality requiring urgent hospital care.",
  },
  {
    flag: "severe_headache_or_blurred_vision",
    ruleId: "MAT_RED_01",
    category: "MATERNAL",
    labelEn: "Severe headache or blurred vision",
    labelHi: "तीव्र शिरोवेदना अथवा अस्पष्ट दृष्टि",
    immediateActions: [
      "Suspect Pre-eclampsia / impending Eclampsia — measure BP immediately",
      "Immediate 108 emergency referral to FRU/CHC/District Hospital",
      "Keep mother lying on her left side in a quiet, dimly lit space during transport",
    ],
    rationale:
      "Severe headache or visual disturbance in pregnancy/postpartum is a critical pre-eclampsia danger sign.",
  },
  {
    flag: "convulsions_or_fits",
    ruleId: "MAT_RED_02",
    category: "MATERNAL",
    labelEn: "Maternal convulsions or fits (eclampsia)",
    labelHi: "गर्भावस्था में आक्षेप एवं मूर्च्छा",
    immediateActions: [
      "Protect airway, turn mother onto left lateral side, do NOT restrain or put anything in mouth",
      "Immediate 108 emergency transfer to FRU for Magnesium Sulfate and emergency obstetric care",
    ],
    rationale:
      "Eclampsia is an immediate maternal and fetal life-threatening emergency.",
  },
  {
    flag: "reduced_fetal_movement",
    ruleId: "MAT_RED_04",
    category: "MATERNAL",
    labelEn: "Reduced or absent fetal movement",
    labelHi: "गर्भस्थ शिशु की गति में न्यूनता",
    immediateActions: [
      "Immediate 108 emergency referral to FRU/PHC for fetal heart rate and ultrasound assessment",
      "Advise mother to lie on left side while arranging transport",
    ],
    rationale:
      "Reduced or absent fetal movement signals potential fetal distress or compromise.",
  },
  {
    flag: "high_fever",
    ruleId: "MAT_RED_05",
    category: "MATERNAL",
    labelEn: "High maternal fever",
    labelHi: "माता को उच्च ज्वर",
    immediateActions: [
      "Immediate 108 emergency referral to FRU/PHC for maternal sepsis management",
      "Give oral fluids and paracetamol if able to swallow during transport",
    ],
    rationale:
      "High maternal fever indicates possible obstetric sepsis requiring parenteral antibiotics.",
  },
  {
    flag: "severe_anemia_signs",
    ruleId: "MAT_RED_06",
    category: "MATERNAL",
    labelEn: "Severe pallor with breathlessness",
    labelHi: "अत्यधिक पांडुता एवं श्वास कष्ट",
    immediateActions: [
      "Immediate 108 emergency referral to FRU/CHC for hemoglobin check and possible IV iron or blood transfusion",
      "Keep mother resting upright; avoid exertion",
    ],
    rationale:
      "Severe anemia (Hb < 7 g/dL) increases risk of cardiac failure and fatal postpartum hemorrhage.",
  },
  {
    flag: "severe_abdominal_pain",
    ruleId: "MAT_RED_07",
    category: "MATERNAL",
    labelEn: "Severe abdominal pain",
    labelHi: "तीव्र उदर शूल",
    immediateActions: [
      "Immediate 108 emergency referral to FRU/District Hospital (rule out placental abruption, ectopic pregnancy, or HELLP syndrome)",
    ],
    rationale:
      "Severe abdominal or right-upper-quadrant pain in pregnancy is an obstetric red flag.",
  },
  {
    flag: "leaking_fluid_before_labor",
    ruleId: "MAT_RED_08",
    category: "MATERNAL",
    labelEn: "Water breaking / leaking fluid before labor",
    labelHi: "प्रसव पूर्व जलस्राव",
    immediateActions: [
      "Immediate 108 emergency referral to FRU/PHC for PROM/PPROM assessment and infection prophylaxis",
      "Keep clean pad and avoid vaginal insertion",
    ],
    rationale:
      "Premature rupture of membranes carries high risk of ascending infection and cord prolapse.",
  },
  {
    flag: "swelling_face_and_hands",
    ruleId: "MAT_RED_09",
    category: "MATERNAL",
    labelEn: "Sudden swelling of face and hands",
    labelHi: "मुख एवं हस्त पर आकस्मिक शोथ",
    immediateActions: [
      "Check BP immediately and refer urgently via 108 to FRU/PHC for pre-eclampsia evaluation",
    ],
    rationale:
      "Facial or hand edema suggests systemic endothelial dysfunction associated with pre-eclampsia.",
  },
  {
    flag: "breathing_difficulty_or_chest_pain",
    ruleId: "MAT_RED_10",
    category: "MATERNAL",
    labelEn: "Maternal breathing difficulty or chest pain",
    labelHi: "तीव्र श्वास कष्ट अथवा वक्ष शूल",
    immediateActions: [
      "Seat mother upright and arrange immediate 108 emergency transfer to FRU",
    ],
    rationale:
      "Acute dyspnea or chest pain may indicate pulmonary edema, embolism, or peripartum cardiomyopathy.",
  },
] as const;

const DANGER_SIGN_BY_FLAG: ReadonlyMap<WatchDangerSignFlag, WatchDangerSignDefinition> =
  new Map(WATCH_DANGER_SIGNS.map((item) => [item.flag, item]));

const FLAG_ALIASES: Readonly<Record<string, WatchDangerSignFlag>> = {
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
  severe_breathing_difficulty: "severe_respiratory_distress",
  severe_chest_indrawing: "severe_respiratory_distress",
  gasping: "severe_respiratory_distress",
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

export interface WatchDangerScreenInput {
  patientId?: string | null;
  nodeId?: string;
  hlc?: HlcTimestamp;
  tickHlc?: () => HlcTimestamp;
  language?: "en" | "hi";
  watchMode?: WatchMode | null;
  dangerSigns?: readonly string[];
  unableToDrinkOrBreastfeed?: boolean;
  vomitsEverything?: boolean;
  convulsions?: boolean;
  lethargicOrUnconscious?: boolean;
  severeRespiratoryDistress?: boolean;
  severeBleeding?: boolean;
  vaginalBleeding?: boolean;
  severeHeadacheOrBlurredVision?: boolean;
  convulsionsOrFits?: boolean;
  assessmentId?: string;
  triageEventId?: string;
  cardId?: string;
  actionCardEventId?: string;
  assessedAtMs?: number;
}

export interface WatchDangerScreenResult {
  severity: TriageSeverity;
  assessment: TriageAssessment;
  triageEvent: CrdtEvent;
  actionCard: ActionCard | null;
  actionCardEvent: CrdtEvent | null;
  events: CrdtEvent[];
}

function normalizeFlagToken(rawFlag: string): string {
  return rawFlag.trim().toLowerCase().replace(/[-\s]+/g, "_");
}

function resolveDangerFlag(rawFlag: string): WatchDangerSignFlag | string | null {
  const token = normalizeFlagToken(rawFlag);
  if (!token) {
    return null;
  }
  const canonical = FLAG_ALIASES[token] ?? token;
  return canonical;
}

function dedupePreserveOrder(items: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    if (!seen.has(item)) {
      seen.add(item);
      result.push(item);
    }
  }
  return result;
}

function createId(): string {
  if (typeof globalThis.crypto !== "undefined" && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  const rand = Math.random().toString(36).slice(2, 10);
  return `watch-${Date.now().toString(36)}-${rand}`;
}

function normalizePatientId(patientId: string | null | undefined): string | null {
  if (typeof patientId !== "string") {
    return null;
  }
  const trimmed = patientId.trim();
  return trimmed.length > 0 ? trimmed.slice(0, 128) : null;
}

function collectCheckedFlags(input: WatchDangerScreenInput): string[] {
  const collected: string[] = [];

  if (input.unableToDrinkOrBreastfeed) collected.push("not_able_to_drink_or_breastfeed");
  if (input.vomitsEverything) collected.push("vomits_everything");
  if (input.convulsions) collected.push("convulsions");
  if (input.lethargicOrUnconscious) collected.push("lethargic_or_unconscious");
  if (input.severeRespiratoryDistress) collected.push("severe_respiratory_distress");
  if (input.severeBleeding) collected.push("severe_bleeding");
  if (input.vaginalBleeding) collected.push("vaginal_bleeding");
  if (input.severeHeadacheOrBlurredVision) {
    collected.push("severe_headache_or_blurred_vision");
  }
  if (input.convulsionsOrFits) collected.push("convulsions_or_fits");

  if (input.dangerSigns) {
    for (const raw of input.dangerSigns) {
      const resolved = resolveDangerFlag(raw);
      if (resolved !== null) {
        collected.push(resolved);
      }
    }
  }

  return dedupePreserveOrder(collected);
}

/**
 * Deterministically screens pediatric WHO IMNCI and maternal danger signs on Tier-0 Watch.
 *
 * Any single checked danger sign forces `RED_EMERGENCY`, `referral_required: true`,
 * `confidence: 1.0`, `execution_target: "LOCAL_DETERMINISTIC"`, and emits a companion
 * `CRITICAL` `ACTION_CARD_ISSUED` event for immediate 108 emergency guidance.
 */
export function evaluateWatchDangerScreen(
  input: WatchDangerScreenInput,
): WatchDangerScreenResult {
  const nodeId = input.nodeId && input.nodeId.trim().length > 0 ? input.nodeId.trim() : "watch-local";
  const triageHlc: HlcTimestamp = input.tickHlc
    ? input.tickHlc()
    : input.hlc ?? { wall_ms: Date.now(), logical: 0, node_id: nodeId };

  const normalizedPatientId = normalizePatientId(input.patientId);
  const checkedFlags = collectCheckedFlags(input);
  const hasDangerSign = checkedFlags.length > 0;

  const matchedRules: string[] = [];
  const immediateActions: string[] = [];
  const rationales: string[] = [];
  const labelsHi: string[] = [];

  for (const flag of checkedFlags) {
    const def = DANGER_SIGN_BY_FLAG.get(flag as WatchDangerSignFlag);
    if (def) {
      matchedRules.push(def.ruleId);
      immediateActions.push(...def.immediateActions);
      rationales.push(def.rationale);
      labelsHi.push(def.labelHi);
    } else {
      matchedRules.push(`WATCH_DANGER_SIGN_${flag.toUpperCase()}`);
      immediateActions.push("Immediate 108 emergency referral to PHC/FRU");
      rationales.push(`Tier-0 Watch danger sign detected (${flag}).`);
      labelsHi.push("आपातकालीन संकट संकेत");
    }
  }

  const severity: TriageSeverity = hasDangerSign ? "RED_EMERGENCY" : "GREEN_HOME";
  const assessedAtMs = input.assessedAtMs ?? triageHlc.wall_ms;

  const assessment: TriageAssessment = {
    assessment_id: input.assessmentId ?? createId(),
    patient_id: normalizedPatientId,
    severity,
    matched_rules: hasDangerSign
      ? dedupePreserveOrder(matchedRules)
      : ["WATCH_RAPID_NO_DANGER_SIGNS"],
    immediate_actions: hasDangerSign
      ? dedupePreserveOrder([
          "Immediate 108 emergency referral to PHC/FRU",
          ...immediateActions,
        ])
      : ["Continue home monitoring and routine ASHA follow-up"],
    referral_required: hasDangerSign,
    rationale: hasDangerSign
      ? `Tier-0 Watch danger sign detected (${checkedFlags.join(", ")}). ${dedupePreserveOrder(rationales).join(" ")}`
      : "No immediate danger signs detected on Tier-0 Watch screen.",
    confidence: 1.0,
    protocol_source: WATCH_PROTOCOL_SOURCE,
    execution_target: "LOCAL_DETERMINISTIC",
    assessed_at_ms: assessedAtMs,
  };

  const triageEventId = input.triageEventId ?? createId();
  const triageEvent: CrdtEvent = {
    event_id: triageEventId,
    hlc: triageHlc,
    origin_node_id: nodeId,
    patient_id: normalizedPatientId,
    event_type: "TRIAGE_COMPLETED",
    payload: {
      assessment_id: assessment.assessment_id,
      patient_id: assessment.patient_id,
      severity: assessment.severity,
      matched_rules: assessment.matched_rules,
      immediate_actions: assessment.immediate_actions,
      referral_required: assessment.referral_required,
      rationale: assessment.rationale,
      confidence: assessment.confidence,
      protocol_source: assessment.protocol_source,
      execution_target: assessment.execution_target,
      assessed_at_ms: assessment.assessed_at_ms,
    },
    enrichment_state: "NOT_NEEDED",
    ref_event_id: null,
  };

  if (!hasDangerSign) {
    return {
      severity,
      assessment,
      triageEvent,
      actionCard: null,
      actionCardEvent: null,
      events: [triageEvent],
    };
  }

  const language: "en" | "hi" = input.language === "hi" ? "hi" : "en";
  const cardHlc: HlcTimestamp = input.tickHlc
    ? input.tickHlc()
    : {
        wall_ms: triageHlc.wall_ms,
        logical: triageHlc.logical + 1,
        node_id: triageHlc.node_id,
      };

  const uniqueLabelsHi = dedupePreserveOrder(labelsHi);
  const actionCard: ActionCard = {
    card_id: input.cardId ?? createId(),
    patient_id: normalizedPatientId,
    title:
      language === "hi"
        ? "गंभीर आपातकाल: तत्काल चिकित्सालय संदर्भ"
        : "RED EMERGENCY: Immediate 108 Referral",
    summary: (language === "hi"
      ? `आपातकालीन संकट संकेत (${uniqueLabelsHi.join(", ")})। रोगी वाहन 108 से तत्काल चिकित्सालय ले जाएं।`
      : assessment.rationale
    ).slice(0, 1000),
    action_steps:
      language === "hi"
        ? [
            "रोगी वाहन 108 पर तत्काल संपर्क करें",
            "निकटतम प्राथमिक स्वास्थ्य केंद्र अथवा चिकित्सालय ले जाएं",
            "यात्रा के समय रोगी को शांत एवं सुरक्षित स्थिति में रखें",
          ]
        : [...assessment.immediate_actions],
    priority: "CRITICAL",
    severity: "RED_EMERGENCY",
    status: "OPEN",
    target_tier: "TIER_0_WATCH",
    watch_mode: input.watchMode ?? null,
    source_event_id: triageEvent.event_id,
    due_by: null,
    language,
  };

  const actionCardEvent: CrdtEvent = {
    event_id: input.actionCardEventId ?? createId(),
    hlc: cardHlc,
    origin_node_id: nodeId,
    patient_id: normalizedPatientId,
    event_type: "ACTION_CARD_ISSUED",
    payload: {
      card_id: actionCard.card_id,
      patient_id: actionCard.patient_id,
      title: actionCard.title,
      summary: actionCard.summary,
      action_steps: actionCard.action_steps,
      priority: actionCard.priority,
      severity: actionCard.severity,
      status: actionCard.status,
      target_tier: actionCard.target_tier,
      watch_mode: actionCard.watch_mode,
      source_event_id: actionCard.source_event_id,
      due_by: actionCard.due_by,
      language: actionCard.language,
    },
    enrichment_state: "NOT_NEEDED",
    ref_event_id: triageEvent.event_id,
  };

  return {
    severity,
    assessment,
    triageEvent,
    actionCard,
    actionCardEvent,
    events: [triageEvent, actionCardEvent],
  };
}
