"""Integration tests for the Tier-2 PHC Hub FastAPI service and capability router."""

from pathlib import Path

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
    SyncEnvelope,
    TriageAssessment,
    TriageSeverity,
    WatchMode,
)
from aarogya_phc_hub.app import create_app
from aarogya_phc_hub.capability_router import WorkloadKind, route_workload


def test_capability_router_matrix() -> None:
    watch = HardwareCapabilityManifest(
        node_id="watch-01",
        tier=NodeTier.TIER_0_WATCH,
        ram_mb=256,
        cpu_cores=2,
        battery_pct=80,
        watch_mode=WatchMode.CHW_COMPANION,
    )
    phone = HardwareCapabilityManifest(
        node_id="phone-01",
        tier=NodeTier.TIER_1_PHONE,
        ram_mb=4096,
        cpu_cores=8,
        battery_pct=60,
        installed_models=["tiny-risk-v1"],
    )
    hub = HardwareCapabilityManifest(
        node_id="hub-01",
        tier=NodeTier.TIER_2_HUB,
        ram_mb=32768,
        cpu_cores=16,
        battery_pct=100,
    )

    assert route_workload(watch, WorkloadKind.DETERMINISTIC_TRIAGE) == ExecutionTarget.LOCAL_DETERMINISTIC
    assert route_workload(watch, WorkloadKind.VOICE_ASR) == ExecutionTarget.DEFER_TO_HUB
    assert route_workload(phone, WorkloadKind.CLINICAL_SLM_STRUCTURING) == ExecutionTarget.DEFER_TO_HUB
    assert (
        route_workload(phone, WorkloadKind.TINY_RISK_CHECK, required_model="tiny-risk-v1")
        == ExecutionTarget.LOCAL_TINY_ML
    )
    assert route_workload(hub, WorkloadKind.VOICE_ASR) == ExecutionTarget.LOCAL_TINY_ML
    assert route_workload(hub, WorkloadKind.OUTBREAK_DETECTION) == ExecutionTarget.LOCAL_DETERMINISTIC


def test_health_manifest_and_standalone_triage(tmp_path: Path) -> None:
    hub_app = create_app(db_path=tmp_path / "hub.db", node_id="hub-test-01")
    client = TestClient(hub_app)

    health_resp = client.get("/health")
    assert health_resp.status_code == 200
    assert health_resp.json()["status"] == "ok"
    assert health_resp.json()["tier"] == "TIER_2_HUB"

    manifest_resp = client.get("/manifest")
    assert manifest_resp.status_code == 200
    manifest = HardwareCapabilityManifest.model_validate(manifest_resp.json())
    assert manifest.node_id == "hub-test-01"
    assert manifest.tier == NodeTier.TIER_2_HUB
    assert manifest.ram_mb >= 1
    assert manifest.cpu_cores >= 1

    triage_resp = client.post(
        "/api/v1/triage",
        json={
            "patient_id": "pat-101",
            "age_months": 14,
            "danger_signs": ["convulsions"],
        },
    )
    assert triage_resp.status_code == 200
    assessment = TriageAssessment.model_validate(triage_resp.json())
    assert assessment.severity == TriageSeverity.RED_EMERGENCY
    assert assessment.referral_required is True
    assert assessment.confidence == 1.0
    assert assessment.execution_target == ExecutionTarget.LOCAL_DETERMINISTIC


def test_crdt_sync_roundtrip_and_websocket(tmp_path: Path) -> None:
    hub_app = create_app(db_path=tmp_path / "hub_sync.db", node_id="hub-sync-01")
    client = TestClient(hub_app)

    phone_manifest = HardwareCapabilityManifest(
        node_id="phone-asha-01",
        tier=NodeTier.TIER_1_PHONE,
        ram_mb=4096,
        cpu_cores=8,
    )
    patient_evt = CrdtEvent(
        event_id="evt-pat-01",
        hlc=HlcTimestamp(wall_ms=1_700_000_000_000, logical=0, node_id="phone-asha-01"),
        origin_node_id="phone-asha-01",
        patient_id="pat-202",
        event_type=EventType.PATIENT_REGISTERED,
        payload={
            "patient_id": "pat-202",
            "full_name": "Kavita Devi",
            "village_id": "rampur-01",
            "sex": "F",
            "is_pregnant": True,
            "gestational_weeks": 28,
        },
    )
    voice_evt = CrdtEvent(
        event_id="evt-voice-01",
        hlc=HlcTimestamp(wall_ms=1_700_000_001_000, logical=0, node_id="phone-asha-01"),
        origin_node_id="phone-asha-01",
        patient_id="pat-202",
        event_type=EventType.VOICE_NOTE_RECORDED,
        enrichment_state=EnrichmentState.PENDING,
        payload={"language": "hi", "transcript_hint": "High fever"},
    )
    card = ActionCard(
        card_id="card-202",
        patient_id="pat-202",
        title="ANC Follow-up",
        summary="Check BP and hemoglobin at PHC.",
        priority=ActionCardPriority.HIGH,
        target_tier=NodeTier.TIER_0_WATCH,
        watch_mode=WatchMode.CHW_COMPANION,
    )
    card_evt = CrdtEvent(
        event_id="evt-card-01",
        hlc=HlcTimestamp(wall_ms=1_700_000_002_000, logical=0, node_id="phone-asha-01"),
        origin_node_id="phone-asha-01",
        patient_id="pat-202",
        event_type=EventType.ACTION_CARD_ISSUED,
        payload=card.model_dump(mode="json"),
    )

    envelope = SyncEnvelope(
        sender_manifest=phone_manifest,
        sender_hlc=HlcTimestamp(wall_ms=1_700_000_003_000, logical=0, node_id="phone-asha-01"),
        events=[patient_evt, voice_evt, card_evt],
    )
    sync_resp = client.post("/api/v1/sync", json=envelope.model_dump(mode="json"))
    assert sync_resp.status_code == 200
    delta = SyncEnvelope.model_validate(sync_resp.json())
    assert set(delta.ack_event_ids) == {"evt-pat-01", "evt-voice-01", "evt-card-01"}

    patients = client.get("/api/v1/patients").json()
    assert len(patients) == 1
    assert patients[0]["full_name"] == "Kavita Devi"

    cards = client.get("/api/v1/action-cards").json()
    assert len(cards) == 1
    assert cards[0]["card_id"] == "card-202"

    pending = client.get("/api/v1/enrichment/pending").json()
    assert len(pending) == 1
    assert pending[0]["event_id"] == "evt-voice-01"

    # WebSocket peer sync should accept a SyncEnvelope and reply with a valid SyncEnvelope.
    watch_manifest = HardwareCapabilityManifest(
        node_id="watch-asha-01",
        tier=NodeTier.TIER_0_WATCH,
        ram_mb=256,
        cpu_cores=2,
        watch_mode=WatchMode.CHW_COMPANION,
    )
    ws_envelope = SyncEnvelope(
        sender_manifest=watch_manifest,
        sender_hlc=HlcTimestamp(wall_ms=1_700_000_004_000, logical=0, node_id="watch-asha-01"),
    )
    with client.websocket_connect("/ws/mesh") as ws:
        ws.send_json(ws_envelope.model_dump(mode="json"))
        ws_reply = SyncEnvelope.model_validate(ws.receive_json())
        assert ws_reply.sender_manifest.node_id == "hub-sync-01"
        assert len(ws_reply.events) >= 3
