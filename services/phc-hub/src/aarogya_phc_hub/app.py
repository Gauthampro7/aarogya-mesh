"""FastAPI transport and CRDT delta-sync server for the Tier-2 PHC Hub."""

from __future__ import annotations

import os
import tempfile
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Request, Response, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError

from aarogya_clinical_engine import TriageInput, evaluate_triage
from aarogya_contracts import (
    ActionCard,
    CrdtEvent,
    EventType,
    HardwareCapabilityManifest,
    NodeTier,
    PatientRecord,
    SyncEnvelope,
    TriageAssessment,
)
from aarogya_crdt_sync import (
    EventStore,
    HlcClock,
    ProjectedState,
    project_state,
    reconcile_envelopes,
)
from aarogya_phc_hub.blob_store import BlobMetadata, LocalBlobStore
from aarogya_phc_hub.capability_router import WorkloadKind, route_workload


def _detect_ram_mb() -> int:
    """Read total physical RAM in MiB from /proc/meminfo on Linux with a safe fallback."""
    meminfo = Path("/proc/meminfo")
    if meminfo.exists():
        for line in meminfo.read_text(encoding="utf-8").splitlines():
            if line.startswith("MemTotal:"):
                parts = line.split()
                if len(parts) >= 2 and parts[1].isdigit():
                    return max(int(parts[1]) // 1024, 1)
    return 8192


def _detect_has_npu() -> bool:
    """Best-effort Linux check for Intel NPU / accel device nodes."""
    return Path("/dev/accel").exists()


def detect_host_manifest(
    node_id: str = "phc-hub-local",
    installed_models: list[str] | None = None,
) -> HardwareCapabilityManifest:
    """Build a live HardwareCapabilityManifest from the host machine."""
    return HardwareCapabilityManifest(
        node_id=node_id,
        tier=NodeTier.TIER_2_HUB,
        ram_mb=_detect_ram_mb(),
        cpu_cores=max(os.cpu_count() or 1, 1),
        battery_pct=100,
        has_npu=_detect_has_npu(),
        installed_models=list(installed_models or []),
        watch_mode=None,
    )


def create_app(
    *,
    db_path: str | Path = ":memory:",
    blob_dir: str | Path | None = None,
    node_id: str = "phc-hub-local",
    installed_models: list[str] | None = None,
) -> FastAPI:
    """Create a configured Tier-2 PHC Hub FastAPI application."""
    if str(db_path) != ":memory:":
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)
    if blob_dir is not None:
        resolved_blob_dir = Path(blob_dir)
    elif str(db_path) != ":memory:":
        resolved_blob_dir = Path(db_path).parent / "blobs"
    else:
        resolved_blob_dir = Path(tempfile.mkdtemp(prefix="aarogya-hub-blobs-"))

    store = EventStore(db_path=db_path)
    blob_store = LocalBlobStore(root_dir=resolved_blob_dir)
    clock = HlcClock(node_id=node_id)
    manifest = detect_host_manifest(node_id=node_id, installed_models=installed_models)

    hub_app = FastAPI(
        title="Aarogya Mesh — Tier-2 PHC Hub",
        version="0.1.0",
        description="Autonomous offline-first Tier-2 PHC Hub with CRDT delta sync and deterministic clinical triage.",
    )
    hub_app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    hub_app.state.store = store
    hub_app.state.blob_store = blob_store
    hub_app.state.clock = clock
    hub_app.state.manifest = manifest

    def _projected() -> ProjectedState:
        return project_state(store.get_all_events())

    @hub_app.get("/health")
    def health() -> dict[str, Any]:
        return {
            "status": "ok",
            "node_id": manifest.node_id,
            "tier": manifest.tier.value,
            "event_count": store.count(),
            "pending_enrichments": len(store.get_pending_enrichments()),
        }

    @hub_app.get("/manifest", response_model=HardwareCapabilityManifest)
    def get_manifest() -> HardwareCapabilityManifest:
        return manifest

    @hub_app.post("/api/v1/triage", response_model=TriageAssessment)
    def run_triage(payload: TriageInput) -> TriageAssessment:
        execution_target = route_workload(manifest, WorkloadKind.DETERMINISTIC_TRIAGE)
        assessment = evaluate_triage(payload)
        assessment = assessment.model_copy(update={"execution_target": execution_target})

        triage_event = CrdtEvent(
            hlc=clock.tick(),
            origin_node_id=manifest.node_id,
            patient_id=assessment.patient_id,
            event_type=EventType.TRIAGE_COMPLETED,
            payload=assessment.model_dump(mode="json"),
        )
        store.append(triage_event)
        return assessment

    @hub_app.post("/api/v1/sync", response_model=SyncEnvelope)
    def sync_envelope(incoming: SyncEnvelope) -> SyncEnvelope:
        outcome = reconcile_envelopes(store, clock, manifest, incoming)
        return outcome.response_envelope

    @hub_app.get("/api/v1/patients", response_model=list[PatientRecord])
    def list_patients() -> list[PatientRecord]:
        return list(_projected().patients.values())

    @hub_app.get("/api/v1/action-cards", response_model=list[ActionCard])
    def list_action_cards() -> list[ActionCard]:
        return list(_projected().action_cards.values())

    @hub_app.get("/api/v1/enrichment/pending", response_model=list[CrdtEvent])
    def list_pending_enrichments() -> list[CrdtEvent]:
        return store.get_pending_enrichments()

    @hub_app.put("/api/v1/blobs/{blob_key}", response_model=BlobMetadata)
    async def upload_blob(blob_key: str, request: Request) -> BlobMetadata:
        data = await request.body()
        content_type = request.headers.get("content-type", "application/octet-stream")
        try:
            return blob_store.put(blob_key, data, content_type=content_type)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    @hub_app.head("/api/v1/blobs/{blob_key}")
    def check_blob(blob_key: str) -> Response:
        try:
            exists = blob_store.exists(blob_key)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        if not exists:
            raise HTTPException(status_code=404, detail="Blob not found.")
        return Response(status_code=200)

    @hub_app.get("/api/v1/blobs/{blob_key}")
    def download_blob(blob_key: str) -> Response:
        try:
            result = blob_store.get(blob_key)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        if result is None:
            raise HTTPException(status_code=404, detail="Blob not found.")
        data, meta = result
        return Response(
            content=data,
            media_type=meta.content_type,
            headers={"X-Blob-Sha256": meta.sha256},
        )

    @hub_app.websocket("/ws/mesh")
    async def mesh_websocket(websocket: WebSocket) -> None:
        await websocket.accept()
        try:
            while True:
                raw_message = await websocket.receive_json()
                try:
                    incoming = SyncEnvelope.model_validate(raw_message)
                except ValidationError as exc:
                    await websocket.send_json({"error": "invalid_sync_envelope", "detail": exc.errors()})
                    continue
                outcome = reconcile_envelopes(store, clock, manifest, incoming)
                await websocket.send_json(outcome.response_envelope.model_dump(mode="json"))
        except WebSocketDisconnect:
            return

    return hub_app


app = create_app(
    db_path=os.environ.get("AAROGYA_HUB_DB", ".data/phc_hub.db"),
    blob_dir=os.environ.get("AAROGYA_HUB_BLOB_DIR", ".data/blobs"),
    node_id=os.environ.get("AAROGYA_HUB_NODE_ID", "phc-hub-local"),
)
