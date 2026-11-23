# T4-04: EWMA Spatiotemporal Outbreak Detector (`EwmaOutbreakDetector`)

- **Task ID**: `T4-04`
- **Track & Owner**: Track 4 (`services/ml-pipeline/`) — `@Krishnanand-10`
- **Branch**: `feat/ml-ewma-outbreak` (branched from `origin/main`)
- **Allowed Paths**: `services/ml-pipeline/src/aarogya_ml_pipeline/outbreak_detector.py`, `services/ml-pipeline/src/aarogya_ml_pipeline/__init__.py`, `services/ml-pipeline/tests/test_outbreak_detector.py`
- **Forbidden Paths**: `packages/`, `services/phc-hub/`, `apps/`, root `pyproject.toml`, `.github/`, `Makefile`
- **Depends On**: None (runs in parallel with `T4-01`, `T4-02`, `T4-03`)

---

## Copy-Paste Starter Prompt

```text
Read `AGENTS.md`, `services/ml-pipeline/MODULE_GUIDE.md`, and `services/ml-pipeline/src/aarogya_ml_pipeline/interfaces.py`.

Run pre-flight checks (`git fetch origin && git status && gh issue list --state open && gh pr list --state open`) and work on branch `feat/ml-ewma-outbreak`.

Implement ONLY slice T4-04 inside `services/ml-pipeline/`:
1. Create `services/ml-pipeline/src/aarogya_ml_pipeline/outbreak_detector.py` implementing `EwmaOutbreakDetector` behind the `@runtime_checkable` `OutbreakDetector` protocol (`detect_outbreak(self, village_id: str, syndrome: str, daily_counts: list[int]) -> OutbreakSignal`).
2. Use pure Python stdlib (`math`, `statistics`) — or optional NumPy only if already present — with zero heavy ML dependencies so it runs deterministically on every machine and in CI out of the box.
3. Implement statistically sound EWMA control-chart surge detection per `(village_id, syndrome)`:
   - Configurable `alpha` (smoothing factor, default `0.3`, `0 < alpha <= 1`), `sigma_multiplier` (`L`, default `2.5`), `min_baseline_days` (default `4`), and `min_case_floor` (default `3`) to prevent false alarms on tiny villages (e.g., 0 -> 1 case).
   - Compute baseline mean $\mu_0$ and standard deviation $\sigma_0$ over historical window `daily_counts[:-1]` (with Poisson floor $\sigma_{eff} = \max(\sigma_0, \sqrt{\max(\mu_0, 1.0)})$ when baseline variance is zero).
   - Compute EWMA recursion $z_t = \alpha x_t + (1 - \alpha) z_{t-1}$ initialized at $z_0 = \mu_0$ and Upper Control Limit $\text{UCL} = \mu_0 + L \cdot \sigma_{eff} \cdot \sqrt{\frac{\alpha}{2 - \alpha}}$.
   - Trigger `alert_triggered = True` when `z_t >= max(UCL, float(min_case_floor))` and `daily_counts[-1] >= min_case_floor`, setting `severity = TriageSeverity.RED_EMERGENCY` for severe surges (>= 2x UCL) or `TriageSeverity.YELLOW_PHC` for moderate alerts, with crisp human-readable `rationale`.
   - Validate negative counts (`ValueError`) and handle empty/short series safely (`alert_triggered=False`).
4. Add a helper `evaluate_village_syndromes(counts_by_key: dict[tuple[str, str], list[int]]) -> list[OutbreakSignal]` to scan multiple `(village_id, syndrome)` series cleanly for Hub batch evaluation.
5. Export `EwmaOutbreakDetector` in `services/ml-pipeline/src/aarogya_ml_pipeline/__init__.py` and write comprehensive tests in `services/ml-pipeline/tests/test_outbreak_detector.py` covering flat baseline, sudden dengue/diarrhea surge, low-count noise suppression, zero-variance baseline, short series, negative count rejection, and multi-village batch scanning.

Do NOT touch any files outside `services/ml-pipeline/`. Target < 300 LOC. Finish by running the zero-bloat check and `make verify`.
```

---

## Step-by-Step Checklist

1. **Pre-Flight & Branch**: Claim/create the Track 4 Outbreak issue, branch `feat/ml-ewma-outbreak` from `origin/main`, and open a Draft PR early.
2. **EWMA Control-Chart Engine**: Implement `EwmaOutbreakDetector` in `outbreak_detector.py` with validated hyperparameters (`alpha`, `sigma_multiplier`, `min_baseline_days`, `min_case_floor`), Poisson variance floor, and deterministic `OutbreakSignal` output.
3. **Batch Helper**: Add `evaluate_village_syndromes(...)` returning sorted `OutbreakSignal` results across villages and syndromes (e.g., `acute_diarrhea`, `dengue_like_fever`, `respiratory_infection`).
4. **Public Export**: Export `EwmaOutbreakDetector` from `services/ml-pipeline/src/aarogya_ml_pipeline/__init__.py` (keep `StubOutbreakDetector` intact).
5. **Synthetic Surge Tests**: Add `services/ml-pipeline/tests/test_outbreak_detector.py` verifying exact EWMA math, zero false positives on steady low counts, reliable surge detection, and `isinstance(..., OutbreakDetector)`.

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
- `isinstance(EwmaOutbreakDetector(), OutbreakDetector)` is `True` and passes all synthetic surge & edge-case tests with deterministic outputs.
- Zero external heavy dependencies; pure stdlib math works 100% offline.
- Zero `torch`/`cuda`/`nvidia-*`/`tensorflow` packages; `make verify` passes with 0 errors.
- Diff stays strictly inside `services/ml-pipeline/` and < 300 LOC.
