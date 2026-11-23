# `services/phc-hub` — Module Guide (Tier-2 PHC Hub)

**Track**: Tier-2 PHC Laptop Hub Transport, Capability Router & Delta-Sync Server  
**Package**: `aarogya-phc-hub` (importable as `aarogya_phc_hub`)

> **Atomic Starter Prompts**: Pick one independent slice from [`prompts/track-1-phc-hub/`](../../prompts/track-1-phc-hub/) (see the dependency DAG in [`prompts/README.md`](../../prompts/README.md)) and read only that file before coding.

---

## 1. Responsibilities

`services/phc-hub` is the Tier-2 local hub running at a Primary Health Centre (PHC) laptop or mini-PC over local Wi-Fi Hotspot / LAN (zero internet required):

- **Host Manifest Detection (`GET /manifest`)**: Inspects host CPU cores, physical RAM, and installed ML models to advertise a live `HardwareCapabilityManifest` (`NodeTier.TIER_2_HUB`).
- **Capability-Proportional Routing (`capability_router.py`)**: Maps workloads (`DETERMINISTIC_TRIAGE`, `VACCINE_SCHEDULE`, `TINY_RISK_CHECK`, `VOICE_ASR`, `CLINICAL_SLM_STRUCTURING`, `OUTBREAK_DETECTION`) to `LOCAL_DETERMINISTIC`, `LOCAL_TINY_ML`, or `DEFER_TO_HUB`.
- **Local Deterministic Triage (`POST /api/v1/triage`)**: Runs `aarogya_clinical_engine` locally without network calls.
- **CRDT Delta Sync (`POST /api/v1/sync` & `WS /ws/mesh`)**: Accepts a `SyncEnvelope` from Tier-0 Watch or Tier-1 CHW Phone, reconciles events via `aarogya_crdt_sync` (HLC + SQLite `EventStore`), and returns delta events + acknowledgements.
- **Materialized Views & Enrichment Queue**:
  - `GET /api/v1/patients` — CRDT-projected patient roster
  - `GET /api/v1/action-cards` — CRDT-projected action cards for Phone/Watch
  - `GET /api/v1/enrichment/pending` — Pending `VOICE_NOTE_RECORDED` events queued for `services/ml-pipeline`
- **Voice Blob Transport (`blob_store.py`)**:
  - `PUT /api/v1/blobs/{blob_key}` — Idempotent raw audio upload (`audio/webm`, `audio/ogg`, `audio/wav`, max 25 MiB) referenced by `VOICE_NOTE_RECORDED.payload["audio_blob_key"]`
  - `HEAD /api/v1/blobs/{blob_key}` — Fast existence check so Watch/Phone skip re-uploading synced audio
  - `GET /api/v1/blobs/{blob_key}` — Raw audio retrieval for Hub playback and `services/ml-pipeline` (`VoiceTranscriber`)
- **Persistent Local State**:
  - `AAROGYA_HUB_DB` defaults to `.data/phc_hub.db` (survives restarts; gitignored).
  - `AAROGYA_HUB_BLOB_DIR` defaults to `.data/blobs` (gitignored).

---

## 2. Running Locally

From the repo root (`aarogya-mesh/`):

```bash
# Sync workspace dependencies
uv sync

# Start the Hub server on port 8000 (matching README.md and apps/field-pwa)
make run-hub
```

Inspect OpenAPI docs at `http://127.0.0.1:8000/docs`.

---

## 3. Running Hub Integration Tests

```bash
uv run pytest -v services/phc-hub/tests/
uv run ruff check services/phc-hub/
```
