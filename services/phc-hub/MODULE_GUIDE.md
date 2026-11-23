# `services/phc-hub` — Module Guide (Tier-2 PHC Hub)

**Track**: Tier-2 PHC Laptop Hub Transport, Capability Router & Delta-Sync Server  
**Package**: `aarogya-phc-hub` (importable as `aarogya_phc_hub`)

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
