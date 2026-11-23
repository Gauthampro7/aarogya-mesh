"""Offline-first Tier-2 PHC Command Center Dashboard router and read-only API."""

from __future__ import annotations

from collections.abc import Callable
from pathlib import Path
from typing import Annotated, Any

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse, HTMLResponse
from pydantic import BaseModel

from aarogya_contracts import (
    CrdtEvent,
    EventType,
    HardwareCapabilityManifest,
    TriageSeverity,
)
from aarogya_crdt_sync import EventStore, project_state

STATIC_DIR: Path = Path(__file__).resolve().parent / "static"

_STATIC_MEDIA_TYPES: dict[str, str] = {
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".svg": "image/svg+xml",
}


def _resolve_static_file(static_dir: Path, filename: str) -> Path:
    """Safely resolve a single static asset inside ``static_dir`` with traversal guards."""
    if (
        not filename
        or "\x00" in filename
        or "/" in filename
        or "\\" in filename
        or ".." in filename
    ):
        raise HTTPException(status_code=400, detail="Invalid static asset path.")

    root = static_dir.resolve()
    target = (root / filename).resolve()
    if target.parent != root:
        raise HTTPException(status_code=400, detail="Invalid static asset path.")
    if not target.is_file():
        raise HTTPException(status_code=404, detail="Static asset not found.")
    return target


def _serialize_peer(peer: Any) -> dict[str, Any]:
    """Normalize peer entries from ``get_peers`` into JSON-safe dictionaries."""
    if isinstance(peer, BaseModel):
        return peer.model_dump(mode="json")
    if isinstance(peer, dict):
        return dict(peer)
    return {"peer": str(peer)}


def _extract_enrichment_summary(event: CrdtEvent) -> dict[str, Any]:
    """Extract clinical risk score and SHAP attributions from an enrichment event."""
    payload = event.payload
    raw_risk = payload.get("risk_score")
    risk_dict = raw_risk if isinstance(raw_risk, dict) else {}
    transcription_obj = (
        payload.get("transcription")
        if isinstance(payload.get("transcription"), dict)
        else {}
    )
    structured_obj = (
        payload.get("structured_note")
        if isinstance(payload.get("structured_note"), dict)
        else {}
    )
    triage_obj = (
        payload.get("triage_assessment")
        if isinstance(payload.get("triage_assessment"), dict)
        else {}
    )

    risk_score = (
        risk_dict.get("risk_score") if isinstance(raw_risk, dict) else raw_risk
    )
    risk_band = (
        payload.get("risk_band")
        or risk_dict.get("risk_band")
        or triage_obj.get("severity")
        or payload.get("severity")
    )
    shap = (
        payload.get("shap_attributions")
        or payload.get("feature_attributions")
        or risk_dict.get("shap_attributions")
    )
    summary = (
        payload.get("summary")
        or payload.get("transcript")
        or structured_obj.get("recommended_follow_up")
        or triage_obj.get("rationale")
        or transcription_obj.get("transcript")
        or ""
    )

    return {
        "event_id": event.event_id,
        "ref_event_id": event.ref_event_id,
        "patient_id": event.patient_id,
        "origin_node_id": event.origin_node_id,
        "hlc": event.hlc.model_dump(mode="json"),
        "risk_score": risk_score,
        "risk_band": risk_band,
        "shap_attributions": shap if isinstance(shap, (list, dict)) else [],
        "summary": summary,
        "payload": payload,
    }


def create_dashboard_router(
    store: EventStore,
    manifest: HardwareCapabilityManifest,
    get_peers: Callable[[], list[dict[str, Any]]] | None = None,
) -> APIRouter:
    """Create the offline PHC Command Center UI and dashboard API router."""
    router = APIRouter(tags=["dashboard"])

    @router.get("/", response_class=HTMLResponse)
    def serve_dashboard_index() -> HTMLResponse:
        index_path = _resolve_static_file(STATIC_DIR, "index.html")
        return HTMLResponse(content=index_path.read_text(encoding="utf-8"))

    @router.get("/static/{filename:path}")
    def serve_static_asset(filename: str) -> FileResponse:
        asset_path = _resolve_static_file(STATIC_DIR, filename)
        media_type = _STATIC_MEDIA_TYPES.get(
            asset_path.suffix.lower(), "application/octet-stream"
        )
        return FileResponse(path=asset_path, media_type=media_type)

    @router.get("/api/v1/dashboard/summary")
    def dashboard_summary() -> dict[str, Any]:
        projected = project_state(store.get_all_events())
        triage_counts: dict[str, int] = {
            TriageSeverity.RED_EMERGENCY.value: 0,
            TriageSeverity.YELLOW_PHC.value: 0,
            TriageSeverity.GREEN_HOME.value: 0,
        }
        for assessment in projected.triage_history:
            key = assessment.severity.value
            triage_counts[key] = triage_counts.get(key, 0) + 1
        for evt in projected.enrichments.values():
            triage_obj = evt.payload.get("triage_assessment")
            if isinstance(triage_obj, dict):
                sev = triage_obj.get("severity")
                if isinstance(sev, str) and sev in triage_counts:
                    triage_counts[sev] += 1

        raw_peers = get_peers() if get_peers is not None else []
        peers = [_serialize_peer(peer) for peer in raw_peers]
        enrichments = [
            _extract_enrichment_summary(evt) for evt in projected.enrichments.values()
        ]

        return {
            "manifest": manifest.model_dump(mode="json"),
            "peers": peers,
            "patient_count": len(projected.patients),
            "patients": [
                patient.model_dump(mode="json")
                for patient in projected.patients.values()
            ],
            "triage_counts": triage_counts,
            "triage_history": [
                item.model_dump(mode="json") for item in projected.triage_history
            ],
            "pending_enrichments": len(projected.pending_enrichments),
            "completed_enrichments": len(projected.enrichments),
            "enrichments": enrichments,
            "action_cards": [
                card.model_dump(mode="json")
                for card in projected.action_cards.values()
            ],
            "outbreak_alerts": [
                alert.model_dump(mode="json") for alert in projected.outbreak_alerts
            ],
            "event_count": projected.event_count,
            "latest_hlc": (
                projected.latest_hlc.model_dump(mode="json")
                if projected.latest_hlc is not None
                else None
            ),
        }

    @router.get("/api/v1/events", response_model=list[CrdtEvent])
    def list_events(
        limit: Annotated[int, Query(ge=1, le=500)] = 50,
        event_type: Annotated[EventType | None, Query()] = None,
    ) -> list[CrdtEvent]:
        events = store.get_all_events()
        if event_type is not None:
            events = [evt for evt in events if evt.event_type == event_type]
        events.sort(
            key=lambda evt: (
                evt.hlc.wall_ms,
                evt.hlc.logical,
                evt.hlc.node_id,
                evt.event_id,
            ),
            reverse=True,
        )
        return events[:limit]

    return router
