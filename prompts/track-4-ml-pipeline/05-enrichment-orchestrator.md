# T4-05: Deferred Enrichment Orchestrator (`EnrichmentPipeline`)

- **Task ID**: `T4-05`
- **Track & Owner**: Track 4 (`services/ml-pipeline/`) — `@Krishnanand-10`
- **Branch**: `feat/ml-enrichment-pipeline` (branched from `origin/main`)
- **Allowed Paths**: `services/ml-pipeline/src/aarogya_ml_pipeline/pipeline.py`, `services/ml-pipeline/src/aarogya_ml_pipeline/__init__.py`, `services/ml-pipeline/pyproject.toml`, `services/ml-pipeline/tests/test_enrichment_pipeline.py`
- **Forbidden Paths**: `packages/`, `services/phc-hub/`, `apps/`, root `pyproject.toml`, `.github/`, `Makefile`
- **Depends On**: `T4-01`, `T4-02`, `T4-03`, `T4-04` (can also develop against the 4 protocols + `Stub*` adapters first, then wire concrete defaults once merged)

---

## Copy-Paste Starter Prompt

```text
Read `AGENTS.md`, `ARCHITECTURE.md` (Sections 1, 3, 4), `services/ml-pipeline/src/aarogya_ml_pipeline/interfaces.py`, `packages/clinical-engine/src/aarogya_clinical_engine/triage.py`, and `packages/contracts/src/aarogya_contracts/models.py` (all non-Track-4 files read-only).

Run pre-flight checks (`git fetch origin && git status && gh issue list --state open && gh pr list --state open`) and work on branch `feat/ml-enrichment-pipeline`.

Implement ONLY slice T4-05 inside `services/ml-pipeline/`:
1. Add `"aarogya-clinical-engine"` to `dependencies` in `services/ml-pipeline/pyproject.toml` (already registered as a workspace source in root `pyproject.toml`; do NOT edit root `pyproject.toml`).
2. Create `services/ml-pipeline/src/aarogya_ml_pipeline/pipeline.py` implementing `EnrichmentPipeline`, accepting injectable `VoiceTranscriber`, `ClinicalSlmStructurer`, `RiskScorer`, and `OutbreakDetector` instances (defaulting to the concrete backends with automatic stub fallback).
3. Implement `EnrichmentPipeline.process_voice_note(voice_event: CrdtEvent, *, hub_node_id: str, hlc: HlcTimestamp, audio_bytes: bytes | None = None, patient_context: dict[str, Any] | None = None, village_syndrome_counts: dict[tuple[str, str], list[int]] | None = None) -> list[CrdtEvent]`:
   - Validate `voice_event.event_type == EventType.VOICE_NOTE_RECORDED`.
   - Step A (ASR): Transcribe `audio_bytes` (fetched by the Hub worker from `LocalBlobStore` via `payload["audio_blob_key"]`) or fall back to `payload.get("transcript_hint", "")`.
   - Step B (SLM GBNF): Extract `StructuredClinicalNote` (`extracted_symptoms`, `candidate_danger_flags`, `recommended_follow_up`).
   - Step C (CLINICAL SAFETY FLOOR — MANDATORY): Feed `candidate_danger_flags` + `extracted_symptoms` + any `patient_context` vitals/pregnancy fields into `aarogya_clinical_engine.evaluate_triage(TriageInput(...))`. The deterministic `TriageAssessment.severity` and `referral_required` are authoritative — local ML/SLM/RiskScorer MUST NEVER downgrade or override `RED_EMERGENCY`.
   - Step D (Risk + Outbreak): Compute advisory `RiskScoreResult` via `RiskScorer`, and if `village_syndrome_counts` is supplied, evaluate `OutbreakDetector`.
   - Step E (Emit Contract-Valid Events with monotonic `HlcTimestamp` logical increments):
     1. `ENRICHMENT_COMPLETED` (`enrichment_state=EnrichmentState.COMPLETED`, `ref_event_id=voice_event.event_id`, payload containing `transcription`, `structured_note`, `triage_assessment`, `risk_score`).
     2. `ACTION_CARD_ISSUED` (`ref_event_id=voice_event.event_id`, payload validated by `ActionCard`, priority/severity anchored strictly to the deterministic `TriageAssessment`, `source_event_id=enrichment_event.event_id`).
     3. `OUTBREAK_ALERT_RAISED` (only when `OutbreakSignal.alert_triggered` is `True`, payload validated from `OutbreakSignal`).
4. Keep `enrich_voice_note_event(...)` in `interfaces.py` backward-compatible so existing Hub & ML tests remain green.
5. Export `EnrichmentPipeline` in `services/ml-pipeline/src/aarogya_ml_pipeline/__init__.py` and add end-to-end tests in `services/ml-pipeline/tests/test_enrichment_pipeline.py` proving:
   - Single extracted danger sign (`convulsions`, `vaginal_bleeding`) forces `RED_EMERGENCY` via `evaluate_triage` even if `RiskScorer` returns `LOW`.
   - Emitted events pass strict `CrdtEvent` and `ActionCard` Pydantic validation with monotonic HLCs and `ref_event_id == voice_event.event_id`.
   - Outbreak surge emits `OUTBREAK_ALERT_RAISED`; flat baseline does not.

Do NOT touch any files outside `services/ml-pipeline/`. Target < 300 LOC. Finish by running the zero-bloat check and `make verify`.
```

---

## Step-by-Step Checklist

1. **Pre-Flight & Branch**: Claim/create the Track 4 Orchestrator issue, branch `feat/ml-enrichment-pipeline` from `origin/main`, and open a Draft PR early.
2. **Workspace Dep**: Add `"aarogya-clinical-engine"` to `services/ml-pipeline/pyproject.toml` and run `uv sync --all-packages` to verify clean resolution.
3. **Orchestrator Module**: Implement `EnrichmentPipeline` in `pipeline.py` composing ASR -> GBNF SLM -> **deterministic `evaluate_triage` hard floor** -> `RiskScorer` -> optional `OutbreakDetector` -> contract-valid `CrdtEvent` list.
4. **HLC & Contract Invariants**: Increment `hlc.logical` monotonically for each emitted event; ensure `ENRICHMENT_COMPLETED` sets `ref_event_id = voice_event.event_id` and `ActionCard.source_event_id = enrichment_event.event_id`.
5. **End-to-End Tests**: Add `tests/test_enrichment_pipeline.py` verifying safety-floor dominance (low ML risk cannot downgrade deterministic `RED_EMERGENCY`), audio-bytes vs `transcript_hint` paths, and conditional `OUTBREAK_ALERT_RAISED` emission.

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
- `EnrichmentPipeline` composes all 4 ML protocols and routes extracted danger signs through `aarogya_clinical_engine.evaluate_triage` as the unbreakable Clinical Safety Floor.
- All emitted `ENRICHMENT_COMPLETED`, `ACTION_CARD_ISSUED`, and `OUTBREAK_ALERT_RAISED` events pass strict `aarogya_contracts` validation and preserve `enrich_voice_note_event` compatibility.
- Zero `torch`/`cuda`/`nvidia-*`/`tensorflow` packages; `make verify` passes with 0 errors.
- Diff stays strictly inside `services/ml-pipeline/` and < 300 LOC.
