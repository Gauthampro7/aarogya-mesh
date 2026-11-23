# Aarogya Mesh — Team Board (4-Developer Split)

**Hackathon Window**: Mon Nov 23 – Thu Nov 26  
**Collaboration Model**: Contract-locked modules + Trunk-Based Development (see [CONTRIBUTING.md](./CONTRIBUTING.md)).

Each teammate owns one isolated directory so all 4 tracks can develop, test, and demo in parallel with **zero merge conflicts**.

---

## Track Overview

| Track | Module Directory | Owner | Status | Primary Stack |
| --- | --- | --- | --- | --- |
| **Track 1** | `packages/contracts`, `packages/clinical-engine`, `packages/crdt-sync`, `services/phc-hub` | **Core Bedrock (`@Gauthampro7`)** | Built & Verified | Python 3.12, Pydantic v2, SQLite, FastAPI |
| **Track 2** | `apps/field-pwa` | **`@Akarshx-x`** | Merged (#2–#7) · Polish | TypeScript, Offline PWA, Service Worker, IndexedDB |
| **Track 3** | `apps/watch-companion` | **`@aril-travass`** | Claimed (#8) · In Progress | TypeScript, Dual-Mode 360x360 Watch UI |
| **Track 4** | `services/ml-pipeline` | **`@Krishnanand-10`** | Assigned · Ready to Claim | Python 3.12, `whisper.cpp`, `Qwen2.5-3B` GBNF, `LightGBM+SHAP`, `EWMA` |

### Atomic Starter Prompts (`prompts/`)

Use [`prompts/README.md`](./prompts/README.md) to grab a decoupled, contract-locked starter prompt for your next slice (paste directly into your AI agent after claiming the matching Issue):

- **Track 1 (`services/phc-hub`)**: [`prompts/track-1-phc-hub/`](./prompts/track-1-phc-hub/)
- **Track 2 (`apps/field-pwa`)**: [`prompts/track-2-field-pwa/`](./prompts/track-2-field-pwa/)
- **Track 3 (`apps/watch-companion`)**: [`prompts/track-3-watch-companion/`](./prompts/track-3-watch-companion/)
- **Track 4 (`services/ml-pipeline`)**: [`prompts/track-4-ml-pipeline/`](./prompts/track-4-ml-pipeline/)

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

## Sub-Task Claiming & Anti-Conflict Protocol

Follow this protocol before writing any code (human developers and AI coding agents alike — see [AGENTS.md](./AGENTS.md)):

1. **Assign Before Coding**: Check open GitHub Issues (`gh issue list`). **Assign** the sub-task Issue to yourself before writing code. If an Issue is already assigned, do not touch it.
2. **Claim-by-Draft-PR**: Push your first small commit early and open a **Draft PR** immediately (`gh pr create --draft`) so everyone sees live active files.
3. **Rebase & Merge Fast**: Rebase (`git fetch origin && git rebase origin/main`) before branching and again before marking Ready for Review. Merge small slices (**< 300 LOC**) every **2–4 hours**.
4. **Edge-Case Escalation**: Need a `packages/contracts` schema bump or a root `pyproject.toml` dependency change? Never sneak it into a feature PR — open a **tiny standalone PR first**, run `make verify`, get `@Gauthampro7` approval, merge, and rebase your feature branch.

---

## How to Claim Your Track

1. Open (or pick) a GitHub Issue using the **Module Claim** template (`.github/ISSUE_TEMPLATE/module_claim.md`) and **assign it to yourself**.
2. Check `gh pr list` and rebase onto `origin/main`: `git fetch origin && git checkout -b feat/<module>-initial origin/main`.
3. Push your initial commit early and open a **Draft PR** (Claim-by-Draft-PR).
4. Follow [CONTRIBUTING.md](./CONTRIBUTING.md) and [AGENTS.md](./AGENTS.md), and run `make verify` before marking Ready for Review.
