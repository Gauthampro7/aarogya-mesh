/**
 * AUTO-GENERATED exact copy of `packages/clinical-engine/rules/maternal_anc.json` (repo commit 53c61b2).
 * Bundled so triage runs fully offline on the phone. DO NOT hand-edit values;
 * regenerate from the source JSON. Parity is enforced by tests/clinical/rules_parity.test.ts.
 */

import type { MaternalAncRules } from "./types";

export const MATERNAL_ANC_RULES: MaternalAncRules = {
  "protocol_id": "NHM_ASHA_MATERNAL_ANC_PNC_2024",
  "version": "1.0.0",
  "description": "Deterministic NHM ASHA Antenatal (ANC) & Postnatal (HBNC/PNC) red-flag triage and checklist rules.",
  "vital_thresholds": {
    "bp_red_systolic_mmhg": 140,
    "bp_red_diastolic_mmhg": 90,
    "bp_severe_preeclampsia_systolic_mmhg": 160,
    "bp_severe_preeclampsia_diastolic_mmhg": 110,
    "bp_yellow_systolic_mmhg": 130,
    "bp_yellow_diastolic_mmhg": 85,
    "temp_red_fever_c": 38.5,
    "temp_yellow_fever_c": 37.5,
    "hb_severe_anemia_below_g_dl": 7.0,
    "hb_moderate_anemia_below_g_dl": 10.0,
    "spo2_critical_below_pct": 92
  },
  "red_flag_symptoms": [
    {
      "id": "MAT_RED_01",
      "flag": "severe_headache_or_blurred_vision",
      "label": "Severe persistent headache or blurred vision",
      "severity": "RED_EMERGENCY",
      "immediate_actions": [
        "Suspect Pre-eclampsia / impending Eclampsia — measure BP immediately",
        "Urgent referral to FRU/CHC/District Hospital via 108/102 ambulance",
        "Keep mother lying on her left side in a quiet, dimly lit space during transport"
      ],
      "rationale": "Severe headache or visual disturbance in pregnancy/postpartum is a critical pre-eclampsia danger sign."
    },
    {
      "id": "MAT_RED_02",
      "flag": "convulsions_or_fits",
      "label": "Convulsions or fits (Eclampsia)",
      "severity": "RED_EMERGENCY",
      "immediate_actions": [
        "Protect airway, turn mother onto left lateral side, do NOT restrain or put anything in mouth",
        "Immediate 108 emergency transfer to FRU for Magnesium Sulfate and emergency obstetric care"
      ],
      "rationale": "Eclampsia is an immediate maternal and fetal life-threatening emergency."
    },
    {
      "id": "MAT_RED_03",
      "flag": "vaginal_bleeding",
      "label": "Vaginal bleeding in pregnancy or heavy postpartum bleeding",
      "severity": "RED_EMERGENCY",
      "immediate_actions": [
        "Immediate emergency referral to FRU/District Hospital (call 108)",
        "Keep mother lying flat on left side with legs elevated; arrange blood donor contact",
        "Do NOT perform vaginal examination in field setting"
      ],
      "rationale": "Antepartum or postpartum hemorrhage is a leading cause of maternal mortality requiring urgent hospital care."
    },
    {
      "id": "MAT_RED_04",
      "flag": "reduced_fetal_movement",
      "label": "Reduced or absent fetal movements",
      "severity": "RED_EMERGENCY",
      "immediate_actions": [
        "Immediate same-day referral to FRU/PHC for fetal heart rate and ultrasound assessment",
        "Advise mother to lie on left side while arranging transport"
      ],
      "rationale": "Reduced or absent fetal movement signals potential fetal distress or compromise."
    },
    {
      "id": "MAT_RED_05",
      "flag": "high_fever",
      "label": "High fever (>=38.5C) or foul-smelling discharge",
      "severity": "RED_EMERGENCY",
      "immediate_actions": [
        "Urgent referral to FRU/PHC for maternal sepsis / chorioamnionitis / puerperal infection management",
        "Give oral fluids and paracetamol if able to swallow during transport"
      ],
      "rationale": "High maternal fever indicates possible obstetric sepsis requiring parenteral antibiotics."
    },
    {
      "id": "MAT_RED_06",
      "flag": "severe_anemia_signs",
      "label": "Severe pallor with breathlessness at rest or fatigue",
      "severity": "RED_EMERGENCY",
      "immediate_actions": [
        "Urgent referral to FRU/CHC for hemoglobin check and possible IV iron or blood transfusion",
        "Keep mother resting upright; avoid exertion"
      ],
      "rationale": "Severe anemia (Hb < 7 g/dL) increases risk of cardiac failure and fatal postpartum hemorrhage."
    },
    {
      "id": "MAT_RED_07",
      "flag": "severe_abdominal_pain",
      "label": "Severe persistent abdominal or epigastric pain",
      "severity": "RED_EMERGENCY",
      "immediate_actions": [
        "Urgent referral to FRU/District Hospital (rule out placental abruption, ectopic pregnancy, or HELLP syndrome)"
      ],
      "rationale": "Severe abdominal or right-upper-quadrant pain in pregnancy is an obstetric red flag."
    },
    {
      "id": "MAT_RED_08",
      "flag": "leaking_fluid_before_labor",
      "label": "Water breaking / leaking fluid before contractions",
      "severity": "RED_EMERGENCY",
      "immediate_actions": [
        "Urgent referral to FRU/PHC for PROM/PPROM assessment and infection prophylaxis",
        "Keep clean pad and avoid vaginal insertion"
      ],
      "rationale": "Premature rupture of membranes carries high risk of ascending infection and cord prolapse."
    },
    {
      "id": "MAT_RED_09",
      "flag": "swelling_face_and_hands",
      "label": "Sudden swelling of face, hands, or generalized edema",
      "severity": "RED_EMERGENCY",
      "immediate_actions": [
        "Check BP immediately and refer urgently to FRU/PHC for pre-eclampsia evaluation"
      ],
      "rationale": "Facial or hand edema suggests systemic endothelial dysfunction associated with pre-eclampsia."
    },
    {
      "id": "MAT_RED_10",
      "flag": "breathing_difficulty_or_chest_pain",
      "label": "Severe breathing difficulty or chest pain",
      "severity": "RED_EMERGENCY",
      "immediate_actions": [
        "Seat mother upright and arrange immediate 108 emergency transfer to FRU"
      ],
      "rationale": "Acute dyspnea or chest pain may indicate pulmonary edema, embolism, or peripartum cardiomyopathy."
    }
  ],
  "yellow_flag_symptoms": [
    {
      "id": "MAT_YELLOW_01",
      "flag": "mild_pedal_edema",
      "label": "Mild ankle/foot swelling without high BP or headache",
      "severity": "YELLOW_PHC",
      "immediate_actions": [
        "Check BP and urine albumin at PHC/ANM within 48 hours",
        "Advise left-lateral rest and foot elevation"
      ],
      "rationale": "Isolated pedal edema requires BP and urine protein verification to exclude early pre-eclampsia."
    },
    {
      "id": "MAT_YELLOW_02",
      "flag": "persistent_vomiting",
      "label": "Persistent vomiting (unable to retain regular meals)",
      "severity": "YELLOW_PHC",
      "immediate_actions": [
        "Refer to PHC/ANM for hydration assessment and safe antiemetic guidance",
        "Encourage small frequent sips of ORS and bland meals"
      ],
      "rationale": "Persistent vomiting risks dehydration and electrolyte imbalance."
    },
    {
      "id": "MAT_YELLOW_03",
      "flag": "burning_micturition",
      "label": "Burning or painful urination",
      "severity": "YELLOW_PHC",
      "immediate_actions": [
        "Refer to PHC/ANM for urine routine exam and pregnancy-safe antibiotic treatment",
        "Encourage adequate safe drinking water"
      ],
      "rationale": "Untreated UTI in pregnancy increases risk of pyelonephritis and preterm labor."
    },
    {
      "id": "MAT_YELLOW_04",
      "flag": "high_risk_obstetric_history",
      "label": "High-risk obstetric history (prior C-section, stillbirth, twins, age <18 or >35)",
      "severity": "YELLOW_PHC",
      "immediate_actions": [
        "Tag MCP card as High-Risk Pregnancy (HRP) and register for PMSMA specialist checkup on 9th of month",
        "Plan institutional delivery at FRU/CHC"
      ],
      "rationale": "NHM PMSMA guidelines mandate medical officer review and FRU delivery planning for high-risk pregnancies."
    },
    {
      "id": "MAT_YELLOW_05",
      "flag": "moderate_pallor",
      "label": "Visible mild/moderate palmar or conjunctival pallor",
      "severity": "YELLOW_PHC",
      "immediate_actions": [
        "Arrange hemoglobin testing at PHC/ANM",
        "Ensure therapeutic IFA supplementation and iron-rich diet counseling"
      ],
      "rationale": "Clinical pallor requires laboratory confirmation and targeted anemia management."
    }
  ],
  "checklists": {
    "anc_trimester_1": {
      "title": "ANC Trimester 1 Checklist (0-12 Weeks)",
      "protocol": "NHM_ANC_T1",
      "items": [
        {
          "id": "anc_t1_mcp_registration",
          "label": "Early pregnancy registration and MCP Card issued",
          "critical": true,
          "recommended_action": "Register pregnancy at Sub-Centre/AWC and issue Mother & Child Protection (MCP) Card immediately.",
          "escalation_severity": "YELLOW_PHC"
        },
        {
          "id": "anc_t1_bp_check",
          "label": "Baseline blood pressure measured",
          "critical": true,
          "recommended_action": "Measure baseline BP at PHC/ANM to establish pre-eclampsia reference.",
          "escalation_severity": "YELLOW_PHC"
        },
        {
          "id": "anc_t1_hb_blood_group",
          "label": "Hemoglobin, blood group, and Rh typing completed",
          "critical": true,
          "recommended_action": "Refer to PHC/ANM for baseline Hb and blood group/Rh typing.",
          "escalation_severity": "YELLOW_PHC"
        },
        {
          "id": "anc_t1_urine_test",
          "label": "Urine albumin and sugar tested",
          "critical": false,
          "recommended_action": "Complete dipstick urine albumin and sugar test at next ANM clinic.",
          "escalation_severity": "GREEN_HOME"
        },
        {
          "id": "anc_t1_folic_acid",
          "label": "Daily Folic Acid (400 mcg) started",
          "critical": true,
          "recommended_action": "Provide Folic Acid 400 mcg daily supply to prevent neural tube defects.",
          "escalation_severity": "YELLOW_PHC"
        },
        {
          "id": "anc_t1_td1_vaccine",
          "label": "Td-1 (or Td-Booster) vaccination administered",
          "critical": true,
          "recommended_action": "Schedule Td-1 or Td-Booster dose at VHND/Sub-Centre.",
          "escalation_severity": "YELLOW_PHC"
        },
        {
          "id": "anc_t1_infection_screen",
          "label": "HIV, Syphilis, and HBsAg screening completed",
          "critical": false,
          "recommended_action": "Complete mandatory antenatal infection screening at PHC.",
          "escalation_severity": "YELLOW_PHC"
        },
        {
          "id": "anc_t1_danger_signs_counseling",
          "label": "Maternal danger signs and nutrition counseling given",
          "critical": false,
          "recommended_action": "Counsel mother and family on emergency warning signs and 108 transport.",
          "escalation_severity": "GREEN_HOME"
        }
      ]
    },
    "anc_trimester_2": {
      "title": "ANC Trimester 2 Checklist (13-27 Weeks)",
      "protocol": "NHM_ANC_T2",
      "items": [
        {
          "id": "anc_t2_bp_weight",
          "label": "Blood pressure and maternal weight gain recorded",
          "critical": true,
          "recommended_action": "Record BP and weight at PHC/VHND to monitor for hypertension and growth.",
          "escalation_severity": "YELLOW_PHC"
        },
        {
          "id": "anc_t2_repeat_hb",
          "label": "Second-trimester Hemoglobin check completed",
          "critical": true,
          "recommended_action": "Arrange repeat Hb test at PHC/ANM to screen for mid-pregnancy anemia.",
          "escalation_severity": "YELLOW_PHC"
        },
        {
          "id": "anc_t2_ifa_calcium",
          "label": "Daily IFA (Iron-Folic Acid) and Calcium tablets active",
          "critical": true,
          "recommended_action": "Dispense IFA and Calcium tablets (taken separately from tea/coffee/calcium) and verify adherence.",
          "escalation_severity": "YELLOW_PHC"
        },
        {
          "id": "anc_t2_td2_vaccine",
          "label": "Td-2 dose administered (4 weeks after Td-1)",
          "critical": true,
          "recommended_action": "Schedule Td-2 immunization at next VHND/ANM session.",
          "escalation_severity": "YELLOW_PHC"
        },
        {
          "id": "anc_t2_deworming",
          "label": "Single-dose Albendazole (400 mg) after 1st trimester",
          "critical": false,
          "recommended_action": "Provide single-dose Albendazole 400 mg under ANM guidance.",
          "escalation_severity": "GREEN_HOME"
        },
        {
          "id": "anc_t2_gdm_ogtt",
          "label": "Gestational Diabetes (75g OGTT) screening done",
          "critical": true,
          "recommended_action": "Refer to PHC/PMSMA clinic for 75g oral glucose tolerance test.",
          "escalation_severity": "YELLOW_PHC"
        },
        {
          "id": "anc_t2_fetal_movement",
          "label": "Fundal height checked and fetal movement awareness counseled",
          "critical": false,
          "recommended_action": "Counsel mother to monitor daily fetal movements after 20 weeks and report any reduction immediately.",
          "escalation_severity": "GREEN_HOME"
        }
      ]
    },
    "anc_trimester_3": {
      "title": "ANC Trimester 3 Checklist (28-40 Weeks)",
      "protocol": "NHM_ANC_T3",
      "items": [
        {
          "id": "anc_t3_bp_urine_albumin",
          "label": "Blood pressure and urine albumin checked",
          "critical": true,
          "recommended_action": "Perform urgent BP and urine albumin check at PHC/ANM to rule out late-onset pre-eclampsia.",
          "escalation_severity": "YELLOW_PHC"
        },
        {
          "id": "anc_t3_repeat_hb",
          "label": "Third-trimester Hemoglobin verified",
          "critical": true,
          "recommended_action": "Test Hemoglobin at PHC to ensure mother is safe for delivery.",
          "escalation_severity": "YELLOW_PHC"
        },
        {
          "id": "anc_t3_fetal_heart_position",
          "label": "Fetal presentation and fetal heart sound assessed",
          "critical": true,
          "recommended_action": "Arrange ANM/MO abdominal examination for fetal lie and heart rate.",
          "escalation_severity": "YELLOW_PHC"
        },
        {
          "id": "anc_t3_kick_count",
          "label": "Daily fetal movement monitoring confirmed",
          "critical": true,
          "recommended_action": "Instruct mother on daily kick-count check and immediate escalation if movements decrease.",
          "escalation_severity": "YELLOW_PHC"
        },
        {
          "id": "anc_t3_birth_preparedness",
          "label": "Institutional delivery facility, 108 transport, and blood donor identified",
          "critical": true,
          "recommended_action": "Finalize micro-birth plan with family: identified FRU/PHC, emergency 108 contact, and emergency funds.",
          "escalation_severity": "YELLOW_PHC"
        },
        {
          "id": "anc_t3_ifa_calcium_adherence",
          "label": "IFA and Calcium adherence confirmed",
          "critical": false,
          "recommended_action": "Verify remaining IFA/Calcium tablet stock and counsel daily adherence.",
          "escalation_severity": "GREEN_HOME"
        },
        {
          "id": "anc_t3_early_breastfeeding_plan",
          "label": "Early breastfeeding (within 1 hour) and newborn warmth counseled",
          "critical": false,
          "recommended_action": "Counsel family on initiating breastfeeding within 1 hour of birth and delaying first bath.",
          "escalation_severity": "GREEN_HOME"
        }
      ]
    },
    "pnc_mother": {
      "title": "Postnatal Maternal Home Visit Checklist (HBNC)",
      "protocol": "NHM_HBNC_MOTHER",
      "items": [
        {
          "id": "pnc_m_bleeding_check",
          "label": "Checked for excessive vaginal bleeding / foul-smelling lochia",
          "critical": true,
          "recommended_action": "Assess pad soakage immediately; escalate as RED_EMERGENCY if heavy bleeding or foul odor.",
          "escalation_severity": "YELLOW_PHC"
        },
        {
          "id": "pnc_m_temp_bp",
          "label": "Maternal temperature and blood pressure recorded",
          "critical": true,
          "recommended_action": "Record temperature and BP to screen for postpartum sepsis or postpartum pre-eclampsia.",
          "escalation_severity": "YELLOW_PHC"
        },
        {
          "id": "pnc_m_breast_check",
          "label": "Checked breasts for engorgement, cracked nipples, or mastitis",
          "critical": false,
          "recommended_action": "Support correct latching position and refer if fever or red tender breast lump.",
          "escalation_severity": "GREEN_HOME"
        },
        {
          "id": "pnc_m_wound_check",
          "label": "Perineal or C-section incision inspected for infection",
          "critical": true,
          "recommended_action": "Inspect incision site; refer to PHC if redness, pus, or wound opening.",
          "escalation_severity": "YELLOW_PHC"
        },
        {
          "id": "pnc_m_ifa_calcium",
          "label": "Postpartum IFA and Calcium continuation verified",
          "critical": false,
          "recommended_action": "Ensure mother continues IFA and Calcium for 6 months postpartum.",
          "escalation_severity": "GREEN_HOME"
        },
        {
          "id": "pnc_m_family_planning",
          "label": "Postpartum nutrition and spacing counseling provided",
          "critical": false,
          "recommended_action": "Counsel on extra nutritious meals, rest, and postpartum spacing options.",
          "escalation_severity": "GREEN_HOME"
        }
      ]
    },
    "pnc_newborn": {
      "title": "Postnatal Newborn Home Visit Checklist (HBNC)",
      "protocol": "NHM_HBNC_NEWBORN",
      "items": [
        {
          "id": "pnc_nb_temperature_warmth",
          "label": "Newborn temperature checked (36.5-37.4C) and warmth/KMC verified",
          "critical": true,
          "recommended_action": "Measure axillary temperature; initiate Kangaroo Mother Care if cold and escalate if <35.5C or >=37.5C.",
          "escalation_severity": "YELLOW_PHC"
        },
        {
          "id": "pnc_nb_breastfeeding",
          "label": "Exclusive breastfeeding and effective latch observed",
          "critical": true,
          "recommended_action": "Observe a full feed; assist positioning and refer if infant feeds poorly or cannot suck.",
          "escalation_severity": "YELLOW_PHC"
        },
        {
          "id": "pnc_nb_respiratory_rate",
          "label": "Respiratory rate (<60/min) and no severe chest indrawing verified",
          "critical": true,
          "recommended_action": "Count breaths for 1 full minute; refer urgently if >=60/min or severe chest indrawing.",
          "escalation_severity": "YELLOW_PHC"
        },
        {
          "id": "pnc_nb_cord_stump",
          "label": "Umbilical cord stump dry with no redness or pus",
          "critical": true,
          "recommended_action": "Advise keeping cord dry (no oils/ash); refer to PHC if umbilical redness or discharge.",
          "escalation_severity": "YELLOW_PHC"
        },
        {
          "id": "pnc_nb_weight_lbw",
          "label": "Birth/visit weight recorded and LBW (<2.5 kg) flagged",
          "critical": true,
          "recommended_action": "Weigh newborn; if <2.5 kg initiate KMC + frequent feeds + extra HBNC visits; if <1.8 kg refer to SNCU.",
          "escalation_severity": "YELLOW_PHC"
        },
        {
          "id": "pnc_nb_jaundice_activity",
          "label": "Checked for yellow palms/soles (jaundice) and normal limb activity",
          "critical": true,
          "recommended_action": "Examine newborn in daylight; refer urgently if jaundice extends to palms/soles or baby is lethargic.",
          "escalation_severity": "YELLOW_PHC"
        },
        {
          "id": "pnc_nb_birth_vaccines",
          "label": "Birth doses (BCG, OPV-0, HepB-Birth) verified on MCP card",
          "critical": false,
          "recommended_action": "Verify birth vaccines on MCP card and schedule missed BCG/OPV-0 promptly.",
          "escalation_severity": "YELLOW_PHC"
        }
      ]
    }
  }
};
