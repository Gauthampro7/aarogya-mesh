# T1-04 — Tier-2 Hub Real ML Backend Wiring & `/showcase` Projector Stage Polish

- **Task ID**: `T1-04`
- **Track & Owner**: Track 1 — `services/phc-hub/` (**Core `@Gauthampro7`**)
- **Difficulty**: Hard / Cross-Component Integration (two clean sub-parts)
- **Branch**: `feat/phc-hub-ml-wiring-and-showcase`
- **Allowed Paths**:
  - **Part 1 (`/showcase` Projector UX)**:
    - `services/phc-hub/src/aarogya_phc_hub/static/showcase.html`
    - `services/phc-hub/src/aarogya_phc_hub/static/showcase.css`
    - `services/phc-hub/src/aarogya_phc_hub/static/showcase.js`
    - `services/phc-hub/tests/test_dashboard.py`
  - **Part 2 (Real ML Wiring in Hub Worker)**:
    - `services/phc-hub/src/aarogya_phc_hub/enrichment_worker.py`
    - `services/phc-hub/tests/test_enrichment_worker.py`
- **Forbidden Paths**:
  - `services/phc-hub/src/aarogya_phc_hub/static/{index.html,app.css,app.js}` (reserved for `T1-05`)
  - `packages/contracts/`, `packages/clinical-engine/`, `packages/crdt-sync/`, `services/ml-pipeline/`, `apps/`, root `pyproject.toml`
- **Depends On**:
  - Part 1 (`/showcase`): None (can run immediately in parallel)
  - Part 2 (`enrichment_worker.py` wiring): `T4-06` (PR `#22` merged onto `main`)

---

## Copy-Paste Starter Prompt

```text
You are working on Aarogya Mesh (`/home/gautham/Personal/Gautham/Hackathon/1/aarogya-mesh`), Task T1-04.
First read `AGENTS.md`, `services/phc-hub/src/aarogya_phc_hub/enrichment_worker.py`, `services/phc-hub/src/aarogya_phc_hub/static/showcase.{html,css,js}`, `services/phc-hub/tests/test_dashboard.py`, `services/phc-hub/tests/test_enrichment_worker.py`, and `services/ml-pipeline/src/aarogya_ml_pipeline/{__init__,risk_scorer,outbreak_detector}.py`.

Goal: Execute two cleanly separated upgrades inside `services/phc-hub/`:
- Part 1: Make the 3-Tier Live Interactive Stage (`/showcase`) fit cleanly onto a 1280×720 projector viewport with tabbed Hub Brain, Light/Dark theme persistence, working iframe reloads, patient name joins, and pure *Shuddh Tatsama* Hindi.
- Part 2: Wire the real `aarogya_ml_pipeline` backends (`WhisperVoiceTranscriber`, `LlamaCppSlmStructurer`, `LightGbmRiskScorer`, `EwmaOutbreakDetector`) into `EnrichmentWorker` defaults while preserving fail-soft CI execution and the deterministic Clinical Safety Floor.

CRITICAL INVARIANTS:
1. ALLOWED PATHS ONLY: Do NOT touch `static/index.html`, `static/app.css`, `static/app.js` (owned by `T1-05`), `packages/`, `apps/`, or `services/ml-pipeline/`.
2. ZERO `innerHTML` & ZERO EXTERNAL CDNs: Every DOM node in `showcase.js` MUST use `document.createElement` / `textContent` / `replaceChildren`. Zero `http://` or `https://` links in `showcase.{html,css,js}`.
3. CLINICAL SAFETY FLOOR: `EnrichmentWorker._enrich_single_voice_event(...)` MUST continue calling `aarogya_clinical_engine.evaluate_triage(...)` + `_apply_monotonic_severity_floor(...)` so ML/SLM outputs NEVER set or downgrade `TriageSeverity`.
4. FAIL-SOFT CI: Real ML backends default cleanly to stubs when weights/optional wheels are absent; `make verify` must remain <2s with zero PyTorch/CUDA bloat.
5. PURE SHUDDH TATSAMA HINDI: Zero Perso-Arabic loanwords, Hinglish, or Unicode nukta (`\u093c`) in `showcase.js`.

Part 1 — `/showcase` Projector & UX Polish (`showcase.{html,css,js}` + `test_dashboard.py`):
1. 1280×720 Projector Layout (`showcase.css`):
   - Compact `.stage-topbar` and `.stage-narrative` heights and ensure `.stage-columns` keeps all 3 columns (Watch, Phone, Tier-2 Hub Brain) side-by-side at `>=1200px` without pushing Tier-2 Hub Brain below the fold (`min-width: 0`, responsive scaling of Watch/Phone frames).
2. Light/Dark Theme + Language Persistence (`showcase.html`, `showcase.css`, `showcase.js`):
   - Add Light/Dark theme toggle button (`#btn-stage-theme`) persisted in `localStorage` under `aarogya.theme`, and persist language under `aarogya.lang` (shared keys with `/`), guarded with `try/catch`.
3. Working `↻` Reload Buttons & Chromeless Watch Iframe (`showcase.html`, `showcase.js`):
   - Point `#iframe-watch` `src` to `/watch/?embed=1`.
   - Fix `#btn-reload-watch` and `#btn-reload-phone` to reload via `frame.contentWindow.location.reload()` (falling back to reassigning `frame.src` if cross-origin/unavailable).
4. Tabbed Tier-2 Hub Brain & Rich Context (`showcase.html`, `showcase.js`):
   - Organize Tier-2 Hub Brain into 3 compact tabs: `Alerts & Cards` | `SHAP & Triage` | `CRDT Stream` so Outbreak Banner + Action Cards never scroll out of view.
   - Join `patient_id → full_name` across cards/triage/SHAP/stream, add `"+N more"` truncation badges, humanize peer chips (`Watch · Family`, `Watch · CHW`, `Phone · ASHA`, `Hub · PHC`), and preserve `customNarrative` text when toggling EN ↔ हिन्दी.
5. Add assertions in `services/phc-hub/tests/test_dashboard.py` checking `/showcase` returns 200, contains `/watch/?embed=1`, `#btn-stage-theme`, hub brain tabs, zero `innerHTML`, and zero external CDNs.

Part 2 — Real ML Backend Wiring (`enrichment_worker.py` + `test_enrichment_worker.py`, AFTER `T4-06` merges):
1. Wire Real Backends as Default Factories in `EnrichmentWorker.__init__`:
   - Default `transcriber` to `WhisperVoiceTranscriber()`, `structurer` to `LlamaCppSlmStructurer()`, `risk_scorer` to `LightGbmRiskScorer()`, and `outbreak_detector` to `EwmaOutbreakDetector(min_baseline_days=3)` imported from `aarogya_ml_pipeline` (each falls back cleanly to its deterministic stub when local model files or optional native wheels are absent).
2. Align Tabular Risk Features with `RISK_FEATURE_NAMES`:
   - Update `_build_triage_input(...)` in `enrichment_worker.py` to populate the canonical `RISK_FEATURE_NAMES` keys (`age_months`, `fever_days`, `temperature_c`, `respiratory_rate_bpm`, `spo2_pct`, `systolic_bp`, `diastolic_bp`, `hemoglobin_g_dl`, `muac_cm`, `is_pregnant`, `gestational_weeks`, `has_danger_sign`, `symptom_count`) — keeping `respiratory_rate_bpm` (and `respiratory_rate` only if needed for backwards compatibility with custom stub tests) aligned with `LightGbmRiskScorer.score_risk(...)`.
3. Verify Outbreak Sweep Compatibility:
   - Ensure `_run_outbreak_sweep()` with `EwmaOutbreakDetector(min_baseline_days=3)` passes all existing outbreak tests AND `demo_scenarios.py` (`village_outbreak` scenario has baseline days 0–2 + surge day 3 -> `alert_triggered=True`).
4. Add tests in `test_enrichment_worker.py` confirming default `EnrichmentWorker` instantiates real ML backend wrappers, feeds `RISK_FEATURE_NAMES` cleanly, triggers `village_outbreak` via `EwmaOutbreakDetector(min_baseline_days=3)`, and enforces the monotonic `RED_EMERGENCY` safety floor.
```

---

## Step-by-Step Checklist

1. **Part 1**: Update `showcase.html`, `showcase.css`, and `showcase.js` for 1280×720 3-column fit, Light/Dark theme + `aarogya.theme`/`aarogya.lang` persistence, `/watch/?embed=1`, `contentWindow.location.reload()`, tabbed Hub Brain (`Alerts & Cards` | `SHAP & Triage` | `CRDT Stream`), patient name joins, `"+N more"` badges, humanized peer chips, and `customNarrative` preservation.
2. **Part 1 Tests**: Extend `services/phc-hub/tests/test_dashboard.py` and verify `node --check services/phc-hub/src/aarogya_phc_hub/static/showcase.js`.
3. **Part 2** (after `T4-06` merges): Wire `WhisperVoiceTranscriber`, `LlamaCppSlmStructurer`, `LightGbmRiskScorer`, and `EwmaOutbreakDetector(min_baseline_days=3)` into `EnrichmentWorker.__init__` and align risk features with `RISK_FEATURE_NAMES`.
4. **Part 2 Tests**: Verify all Hub tests (`test_enrichment_worker.py`, `test_demo_scenarios.py`, `test_hub_api.py`, `test_dashboard.py`) pass with real default adapters and zero bloat.

---

## Verification Commands & Definition of Done

```bash
node --check services/phc-hub/src/aarogya_phc_hub/static/showcase.js
uv run ruff check services/phc-hub/
uv run pytest -v services/phc-hub/tests/
make verify
```

- [ ] `/showcase` fits all 3 columns cleanly on a `1280×720` viewport with working theme toggle, `↻` reloads, `/watch/?embed=1`, and tabbed Tier-2 Hub Brain.
- [ ] `EnrichmentWorker` defaults to real `aarogya_ml_pipeline` adapters (`EwmaOutbreakDetector(min_baseline_days=3)` + `RISK_FEATURE_NAMES`) while degrading cleanly in CI with zero PyTorch/CUDA bloat.
- [ ] `village_outbreak` demo scenario and monotonic `RED_EMERGENCY` clinical safety tests pass 100%.
- [ ] `make verify` passes (8/8 schemas, 0 ruff errors, all tests green).
