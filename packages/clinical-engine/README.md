# `aarogya-clinical-engine`

Deterministic, offline-first clinical safety engine for **Aarogya Mesh** (`packages/clinical-engine/`).

## Clinical Safety Invariant

1. **Zero LLM / API Dependency**: Every triage classification, maternal ANC/PNC checklist evaluation, and India UIP vaccination schedule runs 100% deterministically on local JSON rule tables (`confidence = 1.0`, `execution_target = LOCAL_DETERMINISTIC`).
2. **Red-Flag Monotonicity**: Any single WHO IMNCI general danger sign or NHM ASHA maternal emergency red flag **immediately forces `TriageSeverity.RED_EMERGENCY` and `referral_required = True`**, regardless of other normal vitals or benign symptoms.
3. **Inspectable Clinical Rule Tables**: All thresholds and action steps live in human-auditable JSON files under `rules/`:
   - `rules/imnci_pediatric.json` — WHO IMNCI pediatric danger signs, age-stratified fast breathing thresholds (`<2m: >=60`, `2-11m: >=50`, `12-60m: >=40`), dehydration, fever, and MUAC/edema malnutrition rules.
   - `rules/maternal_anc.json` — NHM ASHA maternal red flags (pre-eclampsia BP `>=140/90`, severe headache/blurred vision, convulsions, vaginal bleeding, reduced fetal movement, fever `>=38.5°C`, severe anemia `Hb < 7.0 g/dL`) plus ANC Trimester 1–3 and HBNC Postnatal Mother/Newborn checklists.
   - `rules/uip_vaccines.json` — India Universal Immunization Programme (UIP) schedule from Birth (`BCG`, `OPV-0`, `HepB-Birth`) through 6w/10w/14w (`Pentavalent`, `OPV`, `Rotavirus`, `fIPV`, `PCV`), 9m (`MR-1`, `JE-1`, `PCV-Booster`), and 16–24m (`DPT-Booster-1`, `OPV-Booster`, `MR-2`).

## Quick API Usage

### 1. Full Triage & Tier-0 Watch Rapid Screening

```python
from aarogya_clinical_engine import (
    TriageInput,
    evaluate_triage,
    evaluate_watch_rapid_triage,
    triage_to_action_card,
)

# Full WHO IMNCI pediatric assessment (Tier-1 Phone / Tier-2 Hub)
assessment = evaluate_triage(
    TriageInput(
        patient_id="pat-child-01",
        age_months=8,
        has_cough_or_difficult_breathing=True,
        respiratory_rate_bpm=54,  # >= 50 bpm threshold for 2-11 months
    )
)
assert assessment.severity == "YELLOW_PHC"

# Rapid 1-tap Tier-0 Watch danger-sign screening
watch_result = evaluate_watch_rapid_triage(
    danger_signs=["convulsions"],
    patient_id="pat-child-01",
)
assert watch_result.severity == "RED_EMERGENCY"
assert watch_result.referral_required is True
card = triage_to_action_card(watch_result)
```

### 2. Maternal ANC & Postnatal Checklists

```python
from aarogya_clinical_engine import ChecklistType, evaluate_checklist

result = evaluate_checklist(
    ChecklistType.ANC_TRIMESTER_2,
    completed_checks=["anc_t2_bp_weight", "anc_t2_ifa_calcium"],
    patient_id="pat-mat-01",
)
print(result.completion_score, result.missing_critical_checks, len(result.action_cards))
```

### 3. India UIP Vaccination Schedule

```python
from datetime import date
from aarogya_clinical_engine import compute_vaccination_schedule

schedule = compute_vaccination_schedule(
    dob=date(2026, 9, 1),
    administered_vaccines={"BCG": date(2026, 9, 1), "OPV-0": date(2026, 9, 1)},
    as_of_date=date(2026, 10, 20),
)
```

## Running Tests

```bash
uv run pytest packages/clinical-engine/tests -v
```
