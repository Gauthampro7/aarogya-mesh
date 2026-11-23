# Aarogya Mesh — Team Board (4-Developer Split)

**Hackathon Window**: Mon Nov 23 – Thu Nov 26  
**Collaboration Model**: Contract-locked modules + Trunk-Based Development (see [CONTRIBUTING.md](./CONTRIBUTING.md)).

Each teammate owns one isolated directory so all 4 tracks can develop, test, and demo in parallel with **zero merge conflicts**.

---

## Track Overview

| Track | Module Directory | Owner | Status | Primary Stack |
| --- | --- | --- | --- | --- |
| **Track 1** | `packages/contracts`, `packages/clinical-engine`, `packages/crdt-sync`, `services/phc-hub` | **Core Bedrock (Gautham)** | Built & Verified | Python 3.12, Pydantic v2, SQLite, FastAPI |
| **Track 2** | `apps/field-pwa` | **Teammate A** | Ready to Claim | TypeScript, Offline PWA, Service Worker, IndexedDB |
| **Track 3** | `apps/watch-companion` | **Teammate B** | Ready to Claim | TypeScript, Dual-Mode 360x360 Watch UI |
| **Track 4** | `services/ml-pipeline` | **Teammate C** | Ready to Claim | Python 3.12, `whisper.cpp`, `Qwen2.5-3B` GBNF, `LightGBM+SHAP`, `EWMA` |

---

## Track 1: Core Bedrock (Built & Maintained)

**Owned Paths**:
- `packages/contracts/` (`aarogya_contracts` Pydantic v2 models, JSON Schemas, `ts/index.ts`)
- `packages/clinical-engine/` (`aarogya_clinical_engine` deterministic WHO IMNCI triage, maternal/child checklists, India UIP vaccine schedule)
- `packages/crdt-sync/` (`aarogya_crdt_sync` HLC clock, SQLite `EventStore`, deterministic CRDT state projector, sync protocol)
- `services/phc-hub/` (`aarogya_phc_hub` FastAPI local Hub node, capability router, CRDT `/api/v1/sync` endpoint)

**Exposed Interfaces for Teammates**:
- **TypeScript Contracts**: `packages/contracts/ts/index.ts`
- **JSON Schemas**: `packages/contracts/schemas/*.json`
- **Hub HTTP / WS API** (`services/phc-hub/src/aarogya_phc_hub/app.py`):
  - `GET /health`
  - `GET /manifest` -> `HardwareCapabilityManifest`
  - `POST /api/v1/triage` -> `TriageAssessment`
  - `POST /api/v1/sync` -> accepts & returns `SyncEnvelope`
  - `GET /api/v1/patients`
  - `GET /api/v1/action-cards`
  - `GET /api/v1/enrichment/pending`
  - `WS /ws/mesh`

---

## Track 2: Teammate A — `apps/field-pwa` (Tier-1 CHW Offline Phone PWA)

**Owned Path**: `apps/field-pwa/` (do not modify `packages/` or `services/`)  
**Guide**: [apps/field-pwa/MODULE_GUIDE.md](./apps/field-pwa/MODULE_GUIDE.md)

**Interface Entrypoints**:
- `packages/contracts/ts/index.ts` (strict TypeScript types for `CrdtEvent`, `SyncEnvelope`, `PatientRecord`, `TriageAssessment`, `ActionCard`, `HardwareCapabilityManifest`)
- `apps/field-pwa/src/sync_client.ts` (typed sync client talking to Hub `POST /api/v1/sync` and `WS /ws/mesh`)
- `apps/field-pwa/sw.js` & `apps/field-pwa/manifest.webmanifest`

**Definition of Done**:
1. Works 100% offline in Airplane Mode (Service Worker caches app shell + IndexedDB stores local `CrdtEvent` log).
2. Patient registration, WHO IMNCI checklist/triage form, and UIP vaccination tracker emit valid `CrdtEvent` records with HLC timestamps.
3. Voice note capture queues `VOICE_NOTE_RECORDED` (`enrichment_state: "PENDING"`).
4. Sync button / background reconnect exchanges `SyncEnvelope` with `services/phc-hub` and renders incoming `ActionCard` items.

---

## Track 3: Teammate B — `apps/watch-companion` (Tier-0 Dual-Mode Watch Companion)

**Owned Path**: `apps/watch-companion/` (do not modify `packages/` or `services/`)  
**Guide**: [apps/watch-companion/MODULE_GUIDE.md](./apps/watch-companion/MODULE_GUIDE.md)

**Interface Entrypoints**:
- `packages/contracts/ts/index.ts` (`WatchMode`: `CHW_COMPANION` | `PATIENT_FAMILY`, `NodeTier.TIER_0_WATCH`, `CrdtEvent`, `ActionCard`, `TriageSeverity`)
- `apps/watch-companion/index.html` (circular 360x360 watch viewport shell)
- `apps/watch-companion/src/watch_kernel.ts` (autonomous Tier-0 kernel & mode switch)

**Definition of Done**:
1. Circular 360x360 watch UI supports instant toggle between `CHW_COMPANION` and `PATIENT_FAMILY` modes (`WatchMode`).
2. `CHW_COMPANION` mode provides rapid 1-tap danger-sign screening, due `ActionCard` alerts, and peer sync trigger to Phone/Hub.
3. `PATIENT_FAMILY` mode provides clear, pure Indic / visual medication & vaccine reminders, danger-sign SOS alert generation, and offline event logging.
4. Standalone HLC event queue syncs cleanly via `SyncEnvelope` when a Tier-1 Phone or Tier-2 Hub is reachable.

---

## Track 4: Teammate C — `services/ml-pipeline` (Tier-2 Local ML & Outbreak Pipeline)

**Owned Path**: `services/ml-pipeline/` (do not modify `packages/` or `apps/`)  
**Guide**: [services/ml-pipeline/MODULE_GUIDE.md](./services/ml-pipeline/MODULE_GUIDE.md)

**Interface Entrypoints**:
- `services/ml-pipeline/src/aarogya_ml_pipeline/interfaces.py`:
  - `VoiceTranscriber` -> `faster-whisper` / `whisper.cpp` INT8
  - `ClinicalSlmStructurer` -> `llama.cpp` (`Qwen2.5-3B` GBNF-constrained JSON extraction)
  - `RiskScorer` -> `LightGBM` + `SHAP` feature attribution
  - `OutbreakDetector` -> `EWMA` spatiotemporal spike detector
- Consumes `VOICE_NOTE_RECORDED` (`PENDING`) events and emits `ENRICHMENT_COMPLETED` + `ACTION_CARD_ISSUED` + `OUTBREAK_ALERT_RAISED` events conforming to `aarogya_contracts`.

**Definition of Done**:
1. Implements all 4 protocols (`VoiceTranscriber`, `ClinicalSlmStructurer`, `RiskScorer`, `OutbreakDetector`) with zero PyTorch/CUDA dependencies.
2. Gracefully falls back to deterministic local stubs if GGUF/Whisper model weights are absent on a fresh checkout so `make test` always passes.
3. Emitted `ActionCard` and `OUTBREAK_ALERT_RAISED` payloads validate strictly against `aarogya_contracts` models and JSON Schemas.
4. Unit & integration tests in `services/ml-pipeline/tests/` pass under `pytest -v`.

---

## How to Claim Your Track

1. Open a new GitHub Issue using the **Module Claim** template (`.github/ISSUE_TEMPLATE/module_claim.md`).
2. Create your feature branch: `git checkout -b feat/<module>-initial`.
3. Follow [CONTRIBUTING.md](./CONTRIBUTING.md) and run `make verify` before opening your PR.
