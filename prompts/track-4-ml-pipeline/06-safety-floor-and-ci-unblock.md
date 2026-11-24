# T4-06 — ML Pipeline Clinical Safety Floor Hardening & PR `#22` CI Unblock

- **Task ID**: `T4-06`
- **Track & Owner**: Track 4 — `services/ml-pipeline/` Rescue & Hardening (**Core `@Gauthampro7`**)
- **Difficulty**: Hard / Safety-Critical Unblock (PR `#22`, closes `#12`)
- **Branch**: `feat/ml-pipeline-initial` (rebased cleanly onto `origin/main` preserving `@Krishnanand-10` authorship on his 5 commits + 1 focused fix commit)
- **Allowed Paths** (inside isolated worktree `/tmp/fix-pr22` on `origin/feat/ml-pipeline-initial`):
  - `services/ml-pipeline/src/aarogya_ml_pipeline/slm_structurer.py`
  - `services/ml-pipeline/src/aarogya_ml_pipeline/pipeline.py`
  - `services/ml-pipeline/src/aarogya_ml_pipeline/risk_scorer.py`
  - `services/ml-pipeline/scripts/train_synthetic_risk_model.py`
  - `services/ml-pipeline/tests/test_slm_structurer.py`
  - `services/ml-pipeline/tests/test_enrichment_pipeline.py`
  - `services/ml-pipeline/tests/test_risk_scorer.py`
- **Forbidden Paths**: `packages/contracts/`, `packages/clinical-engine/`, `packages/crdt-sync/`, `services/phc-hub/`, `apps/`, root `pyproject.toml`
- **Depends On**: PR `#22` (`origin/feat/ml-pipeline-initial`, commits `45219d1..c5eab42`)

---

## Copy-Paste Starter Prompt

```text
You are working on Aarogya Mesh (`/home/gautham/Personal/Gautham/Hackathon/1/aarogya-mesh`), Task T4-06 (Rescue & Harden Draft PR `#22` so it passes CI and merges cleanly into `origin/main`).

Execute ALL git operations inside an isolated worktree `/tmp/fix-pr22` — NEVER dirty the main working copy!

CRITICAL INVARIANTS (Clinical Safety Floor & Git Integrity):
1. PRESERVE AUTHORSHIP: Rebase `@Krishnanand-10`'s 5 commits cleanly onto `origin/main` using `git rebase --onto origin/main 58a32e9` so his commit authorship stays intact, then add ONE focused fix commit: `fix(ml-pipeline): enforce clinical safety floor, clean fallback risk scoring, and remove /tmp/pylibs`.
2. CLINICAL SAFETY FLOOR (ZERO SILENT DOWNGRADES):
   - Pediatric WHO IMNCI (`packages/clinical-engine/rules/imnci_pediatric.json`) and Maternal NHM ASHA (`packages/clinical-engine/rules/maternal_anc.json`) use distinct canonical flag tokens. Collapsing pediatric flags onto maternal-only tokens (or vice versa) causes `evaluate_triage(...)` to miss a red flag and silently downgrade to `GREEN_HOME`!
   - NEVER use raw substring matching (`if syn_key in cleaned`) in `map_to_canonical_danger_flag(...)` because `"fits"` falsely matches `"benefits"` and `"bleeding"` falsely matches `"no_bleeding"`.
3. ZERO LOCAL ENVIRONMENT HACKS: Remove `sys.path.insert(0, "/tmp/pylibs")` from `risk_scorer.py` and `scripts/train_synthetic_risk_model.py`.
4. ZERO PYTORCH / CUDA BLOAT: Keep `services/ml-pipeline/pyproject.toml` clean so CI passes without `lightgbm`, `shap`, `faster-whisper`, or `llama-cpp-python` installed.

Exact Technical Fixes Required:
1. `services/ml-pipeline/src/aarogya_ml_pipeline/slm_structurer.py`:
   - Keep `very_high_fever` (IMNCI pediatric red flag) and `high_fever` (Maternal ANC red flag) DISTINCT — do NOT collapse `very_high_fever` into `high_fever`.
   - Keep `severe_bleeding` (IMNCI / general red flag) and `vaginal_bleeding` (Maternal ANC red flag) DISTINCT — do NOT collapse `severe_bleeding` into `vaginal_bleeding`.
   - Add missing canonical tokens (`very_high_fever`, `severe_bleeding`, `swelling_face_and_hands`, `convulsions_or_fits`) to `CANONICAL_DANGER_FLAGS` and verify every synonym maps to the clinically accurate canonical code in `packages/clinical-engine/rules/*.json`.
   - Rewrite `map_to_canonical_danger_flag(flag)` to use exact lookup first, followed by negated-phrase guards (e.g., reject `"no_bleeding"`, `"no bleeding"`, `"no fits"`, `"without convulsions"`, `"denies ..."`) and word-boundary regex matching (`re.search(rf"(?<![a-z0-9_]){re.escape(syn_key)}(?![a-z0-9_])", ...)` for ASCII and boundary-safe matching for Devanagari) so `"benefits"` NEVER matches `"fits"` and `"no_bleeding"` NEVER matches `"bleeding"`.
2. `services/ml-pipeline/src/aarogya_ml_pipeline/pipeline.py`:
   - Define `_MATERNAL_ONLY_DANGER_FLAGS = frozenset({"vaginal_bleeding", "severe_headache_or_blurred_vision", "reduced_fetal_movement", "leaking_fluid_before_labor", "high_fever", "swelling_face_and_hands", "severe_abdominal_pain"})`.
   - When `patient_context` is omitted (or does not explicitly set `patient_category` / `is_pregnant`) and any extracted danger flag is in `_MATERNAL_ONLY_DANGER_FLAGS`, infer `patient_category = PatientCategory.MATERNAL` (and pass `is_pregnant=True` if not explicitly `False`) before calling `aarogya_clinical_engine.evaluate_triage(triage_input)` so maternal red flags NEVER downgrade to `GREEN_HOME`!
3. `services/ml-pipeline/src/aarogya_ml_pipeline/risk_scorer.py` & `services/ml-pipeline/scripts/train_synthetic_risk_model.py`:
   - Remove the `if os.path.isdir("/tmp/pylibs")...` `sys.path.insert` hack completely from both files.
   - Fix the deterministic fallback in `LightGbmRiskScorer` (when `lightgbm` or `models/risk_lgbm.txt` is unavailable in CI): ensure `score_risk(features)` accounts monotonically for canonical `RISK_FEATURE_NAMES` (`has_danger_sign`, `temperature_c`, `spo2_pct` hypoxia `<94`/`<90`, `respiratory_rate_bpm`, `systolic_bp`, `diastolic_bp`, `fever_days`, `age_months`, `hemoglobin_g_dl`, `muac_cm`, `symptom_count`) with per-feature `shap_attributions` so `test_monotonicity_with_danger_signs` and `test_monotonicity_with_fever_and_hypoxia` in `tests/test_risk_scorer.py` pass deterministically with zero external wheels.
4. Regression Tests (`services/ml-pipeline/tests/`):
   - Add tests proving:
     a. `very_high_fever` and `severe_bleeding` map distinctly and produce `TriageSeverity.RED_EMERGENCY` + `referral_required=True` via `EnrichmentPipeline`.
     b. Maternal red flags (`vaginal_bleeding`, `severe_headache_or_blurred_vision`, `reduced_fetal_movement`, `high_fever`) WITHOUT `patient_context` infer `MATERNAL` and produce `TriageSeverity.RED_EMERGENCY`.
     c. Substring/negation traps (`"benefits"`, `"no_bleeding"`, `"no fits"`) do NOT map to danger flags.
     d. `LightGbmRiskScorer` fallback passes monotonicity tests in CI without `models/risk_lgbm.txt`.

Clean up `/tmp/fix-pr22` after verification and `--force-with-lease` push to `origin/feat/ml-pipeline-initial`.
```

---

## Step-by-Step Checklist

1. Create isolated worktree: `git fetch origin && git worktree add /tmp/fix-pr22 origin/feat/ml-pipeline-initial` and transplant commits onto `origin/main` via `git rebase --onto origin/main 58a32e9`.
2. Fix `slm_structurer.py` (`very_high_fever` vs `high_fever`, `severe_bleeding` vs `vaginal_bleeding`, `CANONICAL_DANGER_FLAGS`, word-boundary + negation-safe `map_to_canonical_danger_flag`).
3. Fix `pipeline.py` to infer `PatientCategory.MATERNAL` when maternal-only red flags appear without `patient_context`.
4. Remove `/tmp/pylibs` `sys.path` hacks from `risk_scorer.py` & `train_synthetic_risk_model.py`, and calibrate the `LightGbmRiskScorer` CI fallback so all monotonicity tests pass deterministically.
5. Add regression tests, run `uv run ruff check . && uv run pytest -v`, commit cleanly, push with `--force-with-lease`, and remove `/tmp/fix-pr22`.

---

## Verification Commands & Definition of Done

```bash
cd /tmp/fix-pr22
uv sync --all-packages
uv run ruff check .
uv run pytest -v
uv run python -m aarogya_contracts.export_schemas --check
git grep -n "/tmp/pylibs" services/ml-pipeline/ || echo "Clean: zero /tmp/pylibs references"
```

- [ ] Krishna's 5 commits sit cleanly atop `origin/main` with original authorship preserved, followed by 1 clean fix commit.
- [ ] Zero silent red-flag downgrades: `very_high_fever`, `severe_bleeding`, and contextless maternal danger flags all return `RED_EMERGENCY` + `referral_required=True`.
- [ ] `"benefits"` and `"no_bleeding"` do NOT falsely trigger danger flags.
- [ ] Zero `/tmp/pylibs` hacks; `test_risk_scorer.py` passes 100% in CI without optional wheels or model files.
- [ ] `ruff check .` (0 errors) and full workspace `pytest -v` pass 100%.
