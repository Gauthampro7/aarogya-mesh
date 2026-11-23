# T4-03: LightGBM + SHAP Tabular Risk Scorer (`LightGbmRiskScorer`)

- **Task ID**: `T4-03`
- **Track & Owner**: Track 4 (`services/ml-pipeline/`) — `@Krishnanand-10`
- **Branch**: `feat/ml-lightgbm-shap` (branched from `origin/main`)
- **Allowed Paths**: `services/ml-pipeline/src/aarogya_ml_pipeline/risk_scorer.py`, `services/ml-pipeline/scripts/train_synthetic_risk_model.py`, `services/ml-pipeline/models/`, `services/ml-pipeline/src/aarogya_ml_pipeline/__init__.py`, `services/ml-pipeline/pyproject.toml`, `services/ml-pipeline/tests/test_risk_scorer.py`
- **Forbidden Paths**: `packages/`, `services/phc-hub/`, `apps/`, root `pyproject.toml`, `.github/`, `Makefile`
- **Depends On**: None (runs in parallel with `T4-01`, `T4-02`, `T4-04`)

---

## Copy-Paste Starter Prompt

```text
Read `AGENTS.md`, `services/ml-pipeline/MODULE_GUIDE.md`, and `services/ml-pipeline/src/aarogya_ml_pipeline/interfaces.py`.

Run pre-flight checks (`git fetch origin && git status && gh issue list --state open && gh pr list --state open`) and work on branch `feat/ml-lightgbm-shap`.

Implement ONLY slice T4-03 inside `services/ml-pipeline/`:
1. Define a canonical, ordered clinical feature vector (`RISK_FEATURE_NAMES`) aligned with `aarogya_clinical_engine.TriageInput` (e.g., `age_months`, `fever_days`, `temperature_c`, `respiratory_rate_bpm`, `spo2_pct`, `systolic_bp`, `diastolic_bp`, `hemoglobin_g_dl`, `muac_cm`, `is_pregnant`, `gestational_weeks`, `has_danger_sign`, `symptom_count`), handling missing features deterministically via explicit defaults or `NaN`.
2. Create `services/ml-pipeline/scripts/train_synthetic_risk_model.py`: a deterministic (`seed=42`) CPU-only synthetic clinical dataset generator + `lightgbm` binary classifier trainer that serializes a compact LightGBM booster model text file (`.txt`, < 200 KiB) under `services/ml-pipeline/models/risk_lgbm.txt`.
3. Create `services/ml-pipeline/src/aarogya_ml_pipeline/risk_scorer.py` implementing `LightGbmRiskScorer` behind the `@runtime_checkable` `RiskScorer` protocol (`score_risk(self, features: dict[str, float | int | bool]) -> RiskScoreResult`).
4. Compute calibrated `risk_score` (`0.0..1.0`), `risk_band` (`"LOW"` < 0.35, `"MODERATE"` < 0.70, `"HIGH"` >= 0.70), and per-feature `shap_attributions: dict[str, float]` using `shap.TreeExplainer` (or LightGBM's built-in `pred_contrib=True` exact TreeSHAP values so SHAP works even without heavy extras!).
5. Implement automatic offline fallback to `StubRiskScorer` if `lightgbm` is not installed or the serialized model file is absent, setting `backend="stub-lightgbm-fallback"`. Remember: risk scores are strictly advisory and NEVER override `aarogya_clinical_engine` `TriageSeverity`.
6. Put `lightgbm` and `shap` under `[project.optional-dependencies] risk = [...]` in `services/ml-pipeline/pyproject.toml` (CPU-only, zero `torch`/`cuda`/`nvidia-*`).
7. Export `LightGbmRiskScorer` and `RISK_FEATURE_NAMES` in `services/ml-pipeline/src/aarogya_ml_pipeline/__init__.py` and add thorough tests in `services/ml-pipeline/tests/test_risk_scorer.py`.

Do NOT touch any files outside `services/ml-pipeline/`. Target < 300 LOC. Finish by running the zero-bloat check and `make verify`.
```

---

## Step-by-Step Checklist

1. **Pre-Flight & Branch**: Claim/create the Track 4 Risk Scorer issue, branch `feat/ml-lightgbm-shap` from `origin/main`, and open a Draft PR early.
2. **Feature Schema & Synthetic Trainer**: Create `scripts/train_synthetic_risk_model.py` (`seed=42`) producing a deterministic synthetic maternal/pediatric risk dataset and saving a lightweight CPU LightGBM model.
3. **Scorer Implementation**: Implement `LightGbmRiskScorer` in `risk_scorer.py` with lazy imports, `shap.TreeExplainer` / `pred_contrib=True` feature attributions, strict `RiskScoreResult` bounds, and `StubRiskScorer` fallback.
4. **Optional Dependencies & Exports**: Add `[project.optional-dependencies] risk = ["lightgbm>=4.5", "shap>=0.46"]` in `services/ml-pipeline/pyproject.toml` and export `LightGbmRiskScorer` in `__init__.py`.
5. **Unit Tests**: Create `tests/test_risk_scorer.py` verifying `isinstance(..., RiskScorer)`, deterministic repeated scoring, monotonic increase when `has_danger_sign=1` / high fever, valid `shap_attributions` keys, and clean fallback when model file is missing.

---

## Verification Commands & Definition of Done

```bash
# 1. Zero PyTorch / CUDA bloat guard
! uv pip list | grep -iE '^(torch|torchvision|torchaudio|nvidia-|tensorflow)\b'

# 2. Slice unit tests & lint
uv run ruff check services/ml-pipeline/
uv run pytest -v services/ml-pipeline/tests/

# 3. Full monorepo verification gate
make verify
```

**Definition of Done**:
- `LightGbmRiskScorer` conforms to `RiskScorer`, outputs valid `RiskScoreResult` (`0.0 <= risk_score <= 1.0`, valid `risk_band`, finite `shap_attributions`).
- Reproducible synthetic training script (`seed=42`) runs on CPU in seconds; scorer degrades gracefully to `StubRiskScorer` when optional deps/model file are absent.
- Zero `torch`/`cuda`/`nvidia-*`/`tensorflow` packages; `make verify` passes with 0 errors.
- Diff stays strictly inside `services/ml-pipeline/` and < 300 LOC.
