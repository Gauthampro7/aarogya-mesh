# T1-01 — Tier-2 PHC Hub Background Enrichment Worker Loop

- **Task ID**: `T1-01`
- **Track & Owner**: Track 1 — `services/phc-hub/` (Core Bedrock / Gautham)
- **Branch**: `feat/phc-hub-enrichment-worker`
- **Allowed Paths**:
  - `services/phc-hub/src/aarogya_phc_hub/enrichment_worker.py` (new)
  - `services/phc-hub/src/aarogya_phc_hub/app.py` (wire worker into `create_app` lifespan + `POST /api/v1/enrichment/run-once`)
  - `services/phc-hub/pyproject.toml` (add `aarogya-ml-pipeline` dependency if needed)
  - `services/phc-hub/tests/test_enrichment_worker.py` (new)
- **Forbidden Paths**: `packages/contracts/`, `packages/clinical-engine/`, `packages/crdt-sync/`, `services/ml-pipeline/`, `apps/`, root `pyproject.toml`
- **Depends On**: None (runs immediately against `Stub*` protocols in `aarogya_ml_pipeline.interfaces`; automatically upgrades once `T4-05` lands)

---

## Copy-Paste Starter Prompt

```text
You are working on Aarogya Mesh (`/home/gautham/Personal/Gautham/Hackathon/1/aarogya-mesh`), Task T1-01.
First read `AGENTS.md`, `services/phc-hub/src/aarogya_phc_hub/app.py`, `services/phc-hub/src/aarogya_phc_hub/blob_store.py`, `services/phc-hub/src/aarogya_phc_hub/capability_router.py`, and `services/ml-pipeline/src/aarogya_ml_pipeline/interfaces.py`.

Goal: Implement a decoupled background enrichment worker in `services/phc-hub/src/aarogya_phc_hub/enrichment_worker.py` that turns `PENDING` `VOICE_NOTE_RECORDED` CRDT events into schema-valid `ENRICHMENT_COMPLETED`, `ACTION_CARD_ISSUED`, and (when triggered) `OUTBREAK_ALERT_RAISED` events without blocking sync or triage.

Hard Constraints:
1. Only touch Allowed Paths: `services/phc-hub/src/aarogya_phc_hub/{enrichment_worker,app}.py`, `services/phc-hub/pyproject.toml`, and `services/phc-hub/tests/test_enrichment_worker.py`.
2. Clinical Safety Invariant: NEVER let SLM output directly dictate `TriageSeverity`. Feed `StructuredClinicalNote.candidate_danger_flags` and `extracted_symptoms` into `aarogya_clinical_engine.evaluate_triage(...)` so the deterministic rule engine owns severity and `referral_required`.
3. Blob Resilience: Look up `audio_blob_key = event.payload.get("audio_blob_key")` in `LocalBlobStore`. If `audio_blob_key` is set and the blob is missing on disk, skip the event gracefully (leave it `PENDING` for a later cycle after the peer finishes `PUT /api/v1/blobs/{blob_key}`). If no `audio_blob_key` is set, fall back to `payload.get("transcript_hint", "")` bytes.
4. Protocol Injection: Accept injectable `VoiceTranscriber`, `ClinicalSlmStructurer`, `RiskScorer`, and `OutbreakDetector` (defaulting to `Stub*` from `aarogya_ml_pipeline.interfaces`). Use `select_offloadable_jobs(manifest, store.get_pending_enrichments())` and `route_workload(manifest, WorkloadKind.VOICE_ASR)`.
5. Idempotency & Lifecycle: Provide synchronous `run_once() -> EnrichmentRunSummary` (for deterministic tests and `POST /api/v1/enrichment/run-once`) plus an async polling loop managed cleanly via FastAPI `lifespan` (disabled or configurable via `enable_enrichment_worker: bool = False` default in `create_app`, enabled in module-level `app` via env `AAROGYA_HUB_ENRICHMENT_INTERVAL_SEC`).
6. Zero PyTorch/CUDA bloat and keep diff <300 LOC. Run `make verify` before finishing.
```

---

## Step-by-Step Checklist

1. Create `EnrichmentWorker` and `EnrichmentRunSummary` (Pydantic model with `processed`, `skipped_missing_blob`, `emitted_events`, `outbreak_alerts`) in `services/phc-hub/src/aarogya_phc_hub/enrichment_worker.py`.
2. In `run_once()`: fetch `select_offloadable_jobs(manifest, store.get_pending_enrichments())`, guard via `route_workload`, resolve optional `audio_blob_key` from `LocalBlobStore.get(...)`, invoke `VoiceTranscriber` -> `ClinicalSlmStructurer` -> `aarogya_clinical_engine.evaluate_triage(...)` -> `RiskScorer`, and append `ENRICHMENT_COMPLETED` (`ref_event_id=voice_event.event_id`, `enrichment_state=EnrichmentState.COMPLETED`) + `ACTION_CARD_ISSUED` via `clock.tick()`.
3. Aggregate village daily syndrome counts from projected state and run `OutbreakDetector.detect_outbreak(...)`; when `alert_triggered` is `True`, append a deduplicated `OUTBREAK_ALERT_RAISED` event.
4. Wire `EnrichmentWorker` onto `hub_app.state.enrichment_worker`, add `POST /api/v1/enrichment/run-once`, and attach an optional background polling task in FastAPI `lifespan` (off by default in `create_app` so existing unit tests stay deterministic).
5. Write unit + API tests in `services/phc-hub/tests/test_enrichment_worker.py` proving: missing-blob deferral, blob-present enrichment -> `pending_enrichments` drops to `0`, deterministic red-flag override via `evaluate_triage`, idempotent second `run_once()` emits `0` duplicates, and `OUTBREAK_ALERT_RAISED` emission on a surge.

---

## Verification Commands & Definition of Done

```bash
uv sync --all-packages
uv run pytest -v services/phc-hub/tests/test_enrichment_worker.py services/phc-hub/tests/test_hub_api.py
make verify
```

- [ ] `POST /api/v1/enrichment/run-once` processes synced `VOICE_NOTE_RECORDED` + uploaded audio blob and drains `/api/v1/enrichment/pending` to `0`.
- [ ] Missing audio blob is deferred safely without marking the event failed or crashing the loop.
- [ ] `TriageSeverity` on emitted `ActionCard` comes strictly from deterministic `aarogya_clinical_engine.evaluate_triage`.
- [ ] `make verify` passes (8/8 schemas, 0 ruff errors, all tests passing).
