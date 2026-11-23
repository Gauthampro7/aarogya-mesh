"""Unit and API tests for the Tier-2 PHC Hub background enrichment worker."""

from __future__ import annotations

import asyncio
from pathlib import Path

from fastapi import FastAPI
from fastapi.testclient import TestClient

from aarogya_contracts import (
    ActionCard,
    ActionCardPriority,
    CrdtEvent,
    EnrichmentState,
    EventType,
    ExecutionTarget,
    HardwareCapabilityManifest,
    HlcTimestamp,
    NodeTier,
    TriageAssessment,
    TriageSeverity,
    WatchMode,
)
from aarogya_crdt_sync import EventStore, HlcClock, project_state
from aarogya_ml_pipeline.interfaces import StructuredClinicalNote
from aarogya_phc_hub.blob_store import LocalBlobStore
from aarogya_phc_hub.enrichment_worker import (
    EnrichmentRunSummary,
    EnrichmentWorker,
    EnrichmentWorkerStatus,
    create_enrichment_router,
)

_BASE_DAY_MS = 1_700_000_000_000  # Fixed deterministic epoch base
_MS_PER_DAY = 86_400_000


def _make_hub_manifest(
    node_id: str = "phc-hub-01",
    *,
    ram_mb: int = 32768,
    cpu_cores: int = 16,
) -> HardwareCapabilityManifest:
    return HardwareCapabilityManifest(
        node_id=node_id,
        tier=NodeTier.TIER_2_HUB,
        ram_mb=ram_mb,
        cpu_cores=cpu_cores,
        battery_pct=100,
    )


def _register_patient(
    store: EventStore,
    *,
    patient_id: str,
    full_name: str = "Aarav Kumar",
    village_id: str = "rampur-01",
    age_months: int | None = 18,
    is_pregnant: bool = False,
    wall_ms: int = _BASE_DAY_MS,
) -> None:
    payload: dict[str, object] = {
        "patient_id": patient_id,
        "full_name": full_name,
        "village_id": village_id,
        "sex": "F" if is_pregnant else "M",
        "is_pregnant": is_pregnant,
        "preferred_language": "en",
    }
    if age_months is not None:
        payload["age_months"] = age_months
    if is_pregnant:
        payload["gestational_weeks"] = 28

    store.append(
        CrdtEvent(
            event_id=f"evt-reg-{patient_id}",
            hlc=HlcTimestamp(wall_ms=wall_ms, logical=0, node_id="phone-asha-01"),
            origin_node_id="phone-asha-01",
            patient_id=patient_id,
            event_type=EventType.PATIENT_REGISTERED,
            payload=payload,
        )
    )


def test_voice_note_with_uploaded_blob_enriches_and_drains_pending(tmp_path: Path) -> None:
    store = EventStore(":memory:")
    blob_store = LocalBlobStore(tmp_path / "blobs")
    clock = HlcClock("phc-hub-01")
    manifest = _make_hub_manifest()

    _register_patient(store, patient_id="pat-001", age_months=24)
    blob_store.put(
        "vn-pat-001",
        b"Child has fever and cough for 2 days.",
        content_type="audio/webm",
    )

    voice_evt = CrdtEvent(
        event_id="evt-voice-001",
        hlc=HlcTimestamp(wall_ms=_BASE_DAY_MS + 1_000, logical=0, node_id="phone-asha-01"),
        origin_node_id="phone-asha-01",
        patient_id="pat-001",
        event_type=EventType.VOICE_NOTE_RECORDED,
        enrichment_state=EnrichmentState.PENDING,
        payload={"audio_blob_key": "vn-pat-001", "language": "en"},
    )
    store.append(voice_evt)
    assert len(store.get_pending_enrichments()) == 1

    worker = EnrichmentWorker(store, blob_store, clock, manifest)
    summary = worker.run_once()

    assert summary.processed == 1
    assert summary.skipped_missing_blob == 0
    assert summary.emitted_events == 2
    assert summary.outbreak_alerts == 0
    assert summary.pending_remaining == 0
    assert summary.processed_event_ids == ["evt-voice-001"]
    assert store.get_pending_enrichments() == []

    projected = project_state(store.get_all_events())
    assert projected.pending_enrichments == []
    assert "evt-voice-001" in projected.enrichments

    enrichment_evt = projected.enrichments["evt-voice-001"]
    assert enrichment_evt.event_type == EventType.ENRICHMENT_COMPLETED
    assert enrichment_evt.enrichment_state == EnrichmentState.COMPLETED
    assert enrichment_evt.ref_event_id == "evt-voice-001"
    assert enrichment_evt.payload["audio_source"] == "blob"
    assert enrichment_evt.payload["audio_blob_key"] == "vn-pat-001"
    assert "fever" in enrichment_evt.payload["structured_note"]["extracted_symptoms"]

    triage = TriageAssessment.model_validate(enrichment_evt.payload["triage_assessment"])
    assert triage.execution_target == ExecutionTarget.LOCAL_DETERMINISTIC
    assert triage.confidence == 1.0

    cards = projected.action_cards_for_patient("pat-001")
    assert len(cards) == 1
    card = ActionCard.model_validate(cards[0].model_dump(mode="json"))
    assert card.source_event_id == enrichment_evt.event_id
    assert card.severity == triage.severity
    assert card.target_tier == NodeTier.TIER_0_WATCH


def test_missing_blob_fails_soft_with_transcript_hint(tmp_path: Path) -> None:
    store = EventStore(":memory:")
    blob_store = LocalBlobStore(tmp_path / "blobs")
    clock = HlcClock("phc-hub-01")
    manifest = _make_hub_manifest()

    voice_evt = CrdtEvent(
        event_id="evt-voice-fallback",
        hlc=HlcTimestamp(wall_ms=_BASE_DAY_MS + 2_000, logical=0, node_id="phone-asha-01"),
        origin_node_id="phone-asha-01",
        patient_id="pat-002",
        event_type=EventType.VOICE_NOTE_RECORDED,
        enrichment_state=EnrichmentState.PENDING,
        payload={
            "audio_blob_key": "vn-missing-blob",
            "transcript_hint": "Patient reports mild fever and cough.",
            "language": "en",
        },
    )
    store.append(voice_evt)

    worker = EnrichmentWorker(store, blob_store, clock, manifest)
    summary = worker.run_once()

    assert summary.processed == 1
    assert summary.skipped_missing_blob == 0
    assert summary.pending_remaining == 0

    projected = project_state(store.get_all_events())
    enrichment_evt = projected.enrichments["evt-voice-fallback"]
    assert enrichment_evt.payload["audio_source"] == "transcript_hint_fallback"
    assert "fever" in enrichment_evt.payload["structured_note"]["extracted_symptoms"]


def test_missing_blob_without_hint_defers_gracefully_until_uploaded(tmp_path: Path) -> None:
    store = EventStore(":memory:")
    blob_store = LocalBlobStore(tmp_path / "blobs")
    clock = HlcClock("phc-hub-01")
    manifest = _make_hub_manifest()

    voice_evt = CrdtEvent(
        event_id="evt-voice-deferred",
        hlc=HlcTimestamp(wall_ms=_BASE_DAY_MS + 3_000, logical=0, node_id="phone-asha-01"),
        origin_node_id="phone-asha-01",
        patient_id="pat-003",
        event_type=EventType.VOICE_NOTE_RECORDED,
        enrichment_state=EnrichmentState.PENDING,
        payload={"audio_blob_key": "vn-arrives-later", "language": "en"},
    )
    store.append(voice_evt)

    worker = EnrichmentWorker(store, blob_store, clock, manifest)

    first_run = worker.run_once()
    assert first_run.processed == 0
    assert first_run.skipped_missing_blob == 1
    assert first_run.emitted_events == 0
    assert first_run.pending_remaining == 1
    assert len(store.get_pending_enrichments()) == 1

    # Peer finishes uploading audio blob; next sweep enriches cleanly.
    blob_store.put("vn-arrives-later", b"Child has cough.", content_type="audio/ogg")
    second_run = worker.run_once()
    assert second_run.processed == 1
    assert second_run.skipped_missing_blob == 0
    assert second_run.emitted_events == 2
    assert second_run.pending_remaining == 0


def test_invalid_blob_key_fails_soft_without_crashing(tmp_path: Path) -> None:
    store = EventStore(":memory:")
    blob_store = LocalBlobStore(tmp_path / "blobs")
    clock = HlcClock("phc-hub-01")
    manifest = _make_hub_manifest()

    store.append(
        CrdtEvent(
            event_id="evt-bad-blob-key",
            hlc=HlcTimestamp(wall_ms=_BASE_DAY_MS + 4_000, logical=0, node_id="phone-asha-01"),
            origin_node_id="phone-asha-01",
            patient_id="pat-004",
            event_type=EventType.VOICE_NOTE_RECORDED,
            enrichment_state=EnrichmentState.PENDING,
            payload={"audio_blob_key": "../etc/passwd", "language": "en"},
        )
    )

    worker = EnrichmentWorker(store, blob_store, clock, manifest)
    summary = worker.run_once()
    assert summary.processed == 0
    assert summary.skipped_missing_blob == 1
    assert summary.pending_remaining == 1


def test_clinical_safety_floor_forces_red_emergency_on_danger_signs(tmp_path: Path) -> None:
    """Verify deterministic evaluate_triage owns TriageSeverity even if SLM minimizes text."""

    class _DownplayingSlm:
        def structure_note(self, transcript: str, language: str = "en") -> StructuredClinicalNote:
            return StructuredClinicalNote(
                extracted_symptoms=["fever", "convulsions"],
                candidate_danger_flags=["convulsions"],
                recommended_follow_up="Looks minor, rest at home.",
                language=language,
                backend="test-downplaying-slm",
            )

    store = EventStore(":memory:")
    blob_store = LocalBlobStore(tmp_path / "blobs")
    clock = HlcClock("phc-hub-01")
    manifest = _make_hub_manifest()

    _register_patient(store, patient_id="pat-red-1", age_months=12)
    blob_store.put("vn-convulsion", b"Child had a convulsion and high fever", content_type="audio/wav")

    store.append(
        CrdtEvent(
            event_id="evt-voice-red-1",
            hlc=HlcTimestamp(wall_ms=_BASE_DAY_MS + 5_000, logical=0, node_id="phone-asha-01"),
            origin_node_id="phone-asha-01",
            patient_id="pat-red-1",
            event_type=EventType.VOICE_NOTE_RECORDED,
            enrichment_state=EnrichmentState.PENDING,
            payload={"audio_blob_key": "vn-convulsion", "language": "en"},
        )
    )

    # Also test default StubClinicalSlmStructurer with lethargy and maternal bleeding.
    store.append(
        CrdtEvent(
            event_id="evt-voice-red-lethargy",
            hlc=HlcTimestamp(wall_ms=_BASE_DAY_MS + 6_000, logical=0, node_id="phone-asha-01"),
            origin_node_id="phone-asha-01",
            patient_id="pat-red-2",
            event_type=EventType.VOICE_NOTE_RECORDED,
            enrichment_state=EnrichmentState.PENDING,
            payload={"transcript_hint": "Infant is very lethargic and has fever.", "language": "en"},
        )
    )
    store.append(
        CrdtEvent(
            event_id="evt-voice-red-bleeding",
            hlc=HlcTimestamp(wall_ms=_BASE_DAY_MS + 7_000, logical=0, node_id="phone-asha-01"),
            origin_node_id="phone-asha-01",
            patient_id="pat-red-3",
            event_type=EventType.VOICE_NOTE_RECORDED,
            enrichment_state=EnrichmentState.PENDING,
            payload={"transcript_hint": "Mother has heavy bleeding.", "language": "en"},
        )
    )

    # First run only pat-red-1 with the downplaying SLM? Better: test downplaying SLM on its own store,
    # and default stub SLM on lethargy + bleeding!
    store_custom = EventStore(":memory:")
    _register_patient(store_custom, patient_id="pat-red-1", age_months=12)
    store_custom.append(
        CrdtEvent(
            event_id="evt-voice-red-custom",
            hlc=HlcTimestamp(wall_ms=_BASE_DAY_MS + 5_000, logical=0, node_id="phone-asha-01"),
            origin_node_id="phone-asha-01",
            patient_id="pat-red-1",
            event_type=EventType.VOICE_NOTE_RECORDED,
            enrichment_state=EnrichmentState.PENDING,
            payload={"audio_blob_key": "vn-convulsion", "language": "en"},
        )
    )

    custom_worker = EnrichmentWorker(
        store_custom,
        blob_store,
        HlcClock("phc-hub-01"),
        manifest,
        structurer=_DownplayingSlm(),
    )
    custom_summary = custom_worker.run_once()
    assert custom_summary.processed == 1

    custom_state = project_state(store_custom.get_all_events())
    custom_enr = custom_state.enrichments["evt-voice-red-custom"]
    custom_triage = TriageAssessment.model_validate(custom_enr.payload["triage_assessment"])
    assert custom_triage.severity == TriageSeverity.RED_EMERGENCY
    assert custom_triage.referral_required is True
    assert custom_triage.execution_target == ExecutionTarget.LOCAL_DETERMINISTIC
    assert "IMNCI_GDS_03" in custom_triage.matched_rules

    custom_cards = custom_state.action_cards_for_patient("pat-red-1")
    assert len(custom_cards) == 1
    assert custom_cards[0].severity == TriageSeverity.RED_EMERGENCY
    assert custom_cards[0].priority == ActionCardPriority.CRITICAL

    # Now verify default StubClinicalSlmStructurer + evaluate_triage on all 3 danger signs.
    default_worker = EnrichmentWorker(store, blob_store, clock, manifest)
    default_summary = default_worker.run_once()
    assert default_summary.processed == 3

    default_state = project_state(store.get_all_events())
    for evt_id, pid in [
        ("evt-voice-red-1", "pat-red-1"),
        ("evt-voice-red-lethargy", "pat-red-2"),
        ("evt-voice-red-bleeding", "pat-red-3"),
    ]:
        triage = TriageAssessment.model_validate(
            default_state.enrichments[evt_id].payload["triage_assessment"]
        )
        assert triage.severity == TriageSeverity.RED_EMERGENCY
        assert triage.referral_required is True
        cards = default_state.action_cards_for_patient(pid)
        assert len(cards) == 1
        assert cards[0].severity == TriageSeverity.RED_EMERGENCY
        assert cards[0].priority == ActionCardPriority.CRITICAL


def test_idempotency_second_run_emits_zero_duplicates(tmp_path: Path) -> None:
    store = EventStore(":memory:")
    blob_store = LocalBlobStore(tmp_path / "blobs")
    clock = HlcClock("phc-hub-01")
    manifest = _make_hub_manifest()

    blob_store.put("vn-idem-1", b"Patient reports cough.", content_type="audio/webm")
    store.append(
        CrdtEvent(
            event_id="evt-voice-idem-1",
            hlc=HlcTimestamp(wall_ms=_BASE_DAY_MS + 10_000, logical=0, node_id="phone-asha-01"),
            origin_node_id="phone-asha-01",
            patient_id="pat-idem-1",
            event_type=EventType.VOICE_NOTE_RECORDED,
            enrichment_state=EnrichmentState.PENDING,
            payload={"audio_blob_key": "vn-idem-1", "language": "en"},
        )
    )

    worker = EnrichmentWorker(store, blob_store, clock, manifest)
    first = worker.run_once()
    count_after_first = store.count()

    second = worker.run_once()
    assert first.processed == 1
    assert first.emitted_events == 2
    assert second.processed == 0
    assert second.skipped_missing_blob == 0
    assert second.emitted_events == 0
    assert second.outbreak_alerts == 0
    assert second.pending_remaining == 0
    assert store.count() == count_after_first


def test_outbreak_alert_emitted_on_village_surge_and_deduplicated(tmp_path: Path) -> None:
    store = EventStore(":memory:")
    blob_store = LocalBlobStore(tmp_path / "blobs")
    clock = HlcClock("phc-hub-01")
    manifest = _make_hub_manifest()

    # Days 0, 1, 2: baseline 1 fever case/day; Day 3: sudden spike of 7 fever cases in rampur-01
    # (EWMA = 0.35 * 7 + 0.65 * 1 = 3.10 >= threshold 3.0).
    day_schedule = [0, 1, 2, 3, 3, 3, 3, 3, 3, 3]
    for idx, day_offset in enumerate(day_schedule):
        pid = f"pat-surge-{idx}"
        event_ms = _BASE_DAY_MS + day_offset * _MS_PER_DAY + idx * 1_000
        _register_patient(store, patient_id=pid, village_id="rampur-01", wall_ms=event_ms - 500)
        store.append(
            CrdtEvent(
                event_id=f"evt-voice-surge-{idx}",
                hlc=HlcTimestamp(wall_ms=event_ms, logical=0, node_id="phone-asha-01"),
                origin_node_id="phone-asha-01",
                patient_id=pid,
                event_type=EventType.VOICE_NOTE_RECORDED,
                enrichment_state=EnrichmentState.PENDING,
                payload={"transcript_hint": "Patient has high fever.", "language": "en"},
            )
        )

    worker = EnrichmentWorker(store, blob_store, clock, manifest)
    first = worker.run_once()
    assert first.processed == len(day_schedule)
    assert first.outbreak_alerts == 1
    assert first.pending_remaining == 0

    projected = project_state(store.get_all_events())
    assert len(projected.outbreak_alerts) == 1
    alert = projected.outbreak_alerts[0]
    assert alert.event_type == EventType.OUTBREAK_ALERT_RAISED
    assert alert.payload["village_id"] == "rampur-01"
    assert alert.payload["syndrome"] == "fever"
    assert alert.payload["alert_triggered"] is True
    assert alert.payload["severity"] == TriageSeverity.RED_EMERGENCY.value
    assert alert.payload["daily_counts"] == [1, 1, 1, 7]

    # Second run must NOT emit duplicate outbreak alerts.
    second = worker.run_once()
    assert second.processed == 0
    assert second.outbreak_alerts == 0
    assert second.emitted_events == 0
    assert len(project_state(store.get_all_events()).outbreak_alerts) == 1


def test_capability_router_prevents_watch_or_low_ram_enrichment(tmp_path: Path) -> None:
    store = EventStore(":memory:")
    blob_store = LocalBlobStore(tmp_path / "blobs")
    clock = HlcClock("watch-01")
    watch_manifest = HardwareCapabilityManifest(
        node_id="watch-01",
        tier=NodeTier.TIER_0_WATCH,
        ram_mb=256,
        cpu_cores=2,
        watch_mode=WatchMode.CHW_COMPANION,
    )

    store.append(
        CrdtEvent(
            event_id="evt-voice-watch",
            hlc=HlcTimestamp(wall_ms=_BASE_DAY_MS, logical=0, node_id="watch-01"),
            origin_node_id="watch-01",
            patient_id="pat-w1",
            event_type=EventType.VOICE_NOTE_RECORDED,
            enrichment_state=EnrichmentState.PENDING,
            payload={"transcript_hint": "Fever and cough", "language": "en"},
        )
    )

    worker = EnrichmentWorker(store, blob_store, clock, watch_manifest)
    summary = worker.run_once()
    assert summary.processed == 0
    assert summary.emitted_events == 0
    assert summary.pending_remaining == 1


def test_enrichment_router_and_background_loop(tmp_path: Path) -> None:
    store = EventStore(":memory:")
    blob_store = LocalBlobStore(tmp_path / "blobs")
    clock = HlcClock("phc-hub-api")
    manifest = _make_hub_manifest("phc-hub-api")

    store.append(
        CrdtEvent(
            event_id="evt-voice-api-1",
            hlc=HlcTimestamp(wall_ms=_BASE_DAY_MS + 20_000, logical=0, node_id="phone-asha-01"),
            origin_node_id="phone-asha-01",
            patient_id="pat-api-1",
            event_type=EventType.VOICE_NOTE_RECORDED,
            enrichment_state=EnrichmentState.PENDING,
            payload={"transcript_hint": "Fever and cough", "language": "en"},
        )
    )

    worker = EnrichmentWorker(store, blob_store, clock, manifest, poll_interval_sec=2.0)
    app = FastAPI()
    app.include_router(create_enrichment_router(worker))
    client = TestClient(app)

    status_before = EnrichmentWorkerStatus.model_validate(
        client.get("/api/v1/enrichment/status").json()
    )
    assert status_before.node_id == "phc-hub-api"
    assert status_before.running is False
    assert status_before.pending_enrichments == 1
    assert status_before.total_runs == 0

    run_resp = client.post("/api/v1/enrichment/run")
    assert run_resp.status_code == 200
    run_summary = EnrichmentRunSummary.model_validate(run_resp.json())
    assert run_summary.processed == 1
    assert run_summary.emitted_events == 2
    assert run_summary.pending_remaining == 0

    # Alias endpoint /run-once also works and is idempotent.
    run_once_resp = client.post("/api/v1/enrichment/run-once")
    assert run_once_resp.status_code == 200
    run_once_summary = EnrichmentRunSummary.model_validate(run_once_resp.json())
    assert run_once_summary.processed == 0
    assert run_once_summary.emitted_events == 0

    status_after = EnrichmentWorkerStatus.model_validate(
        client.get("/api/v1/enrichment/status").json()
    )
    assert status_after.pending_enrichments == 0
    assert status_after.total_runs == 2
    assert status_after.total_processed == 1
    assert status_after.last_run is not None

    # Verify async background loop starts, drains newly arrived voice note, and stops cleanly.
    async def _exercise_loop() -> None:
        store.append(
            CrdtEvent(
                event_id="evt-voice-loop-1",
                hlc=HlcTimestamp(wall_ms=_BASE_DAY_MS + 30_000, logical=0, node_id="phone-asha-01"),
                origin_node_id="phone-asha-01",
                patient_id="pat-loop-1",
                event_type=EventType.VOICE_NOTE_RECORDED,
                enrichment_state=EnrichmentState.PENDING,
                payload={"transcript_hint": "Child has fever.", "language": "en"},
            )
        )
        await worker.start(interval_sec=0.05)
        assert worker.is_running is True
        # Idempotent second start does not spawn duplicate tasks.
        await worker.start(interval_sec=0.05)
        for _ in range(40):
            if len(store.get_pending_enrichments()) == 0:
                break
            await asyncio.sleep(0.025)
        await worker.stop()
        assert worker.is_running is False

    asyncio.run(_exercise_loop())
    assert store.get_pending_enrichments() == []
    assert "evt-voice-loop-1" in project_state(store.get_all_events()).enrichments
