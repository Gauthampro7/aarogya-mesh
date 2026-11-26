# Aarogya Mesh

**Autonomous, Offline-First, Capability-Proportional Edge Health Mesh** for Community Health Workers (CHWs / ASHAs) and dual-mode Patient-Family/CHW wearable companions.

Built for Hackathon Problem Statement #8 (Offline Health Assistant for Community Health Workers, with dual-mode Tier-0 Watch companion).

---

## Core Architectural Invariants

1. **Autonomous Node Kernel (Zero RPC Coupling)**: Every node — Tier-0 Watch, Tier-1 CHW Phone, and Tier-2 PHC Laptop Hub — operates 100% standalone indefinitely without internet or peer connectivity.
2. **Capability-Proportional Execution**: Each node inspects its `HardwareCapabilityManifest` (`tier`, `ram_mb`, `cpu_cores`, `battery_pct`, `has_npu`, `installed_models`) and routes workloads deterministically (`LOCAL_DETERMINISTIC`, `LOCAL_TINY_ML`, or `DEFER_TO_HUB`).
3. **Clinical Safety Floor**: Deterministic WHO IMNCI & India UIP / ASHA clinical rules (`packages/clinical-engine`) are the immutable hard floor. Local SLMs never own raw triage or override danger-sign escalations.
4. **Opportunistic HLC / CRDT Delta Sync**: Nodes exchange immutable append-only `CrdtEvent` logs ordered by Hybrid Logical Clocks (`packages/crdt-sync`) over local Hotspot / LAN / WebSocket whenever peers come into range, converging with strong eventual consistency.
5. **Zero-Bloat Edge Footprint**: Pure Python 3.12 (`uv`), FastAPI, SQLite, and lightweight CPU/NPU INT8 runtimes — zero PyTorch or CUDA dependencies.

---

## Architecture Overview

```mermaid
flowchart LR
    T0["Tier-0 Watch Companion<br/>(apps/watch-companion)<br/>CHW_COMPANION / PATIENT_FAMILY"]
    T1["Tier-1 CHW Phone PWA<br/>(apps/field-pwa)<br/>Offline IndexedDB + Local Rules"]
    T2["Tier-2 PHC Laptop Hub<br/>(services/phc-hub)<br/>FastAPI + SQLite Event Store"]
    ML["Tier-2 Local ML Pipeline<br/>(services/ml-pipeline)<br/>Whisper / Qwen2.5-3B / LightGBM / EWMA"]

    CORE["Shared Bedrock<br/>packages/contracts (Pydantic + JSON Schema + TS)<br/>packages/clinical-engine (WHO IMNCI + UIP)<br/>packages/crdt-sync (HLC + SQLite + Projector)"]

    T0 <-->|"CRDT Delta SyncEnvelope<br/>(Local Hotspot / LAN)"| T1
    T1 <-->|"CRDT Delta SyncEnvelope<br/>(POST /api/v1/sync & WS /ws/mesh)"| T2
    T2 -->|"Pending Enrichment Events<br/>(VOICE_NOTE_RECORDED)"| ML
    ML -->|"ENRICHMENT_COMPLETED +<br/>ACTION_CARD_ISSUED"| T2

    T0 -.-> CORE
    T1 -.-> CORE
    T2 -.-> CORE
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full mechanism-first specification, and [docs/JUDGE_QA_AND_PITCH_BIBLE.md](./docs/JUDGE_QA_AND_PITCH_BIBLE.md) for the **Adversarial Judge Q&A, 5 Technical Moats & 3-Minute Stage Pitch Playbook**.

---

## 4-Module Ownership Map

| Track | Module Path | Owner | Status |
| --- | --- | --- | --- |
| **Track 1: Core Bedrock** | `packages/contracts`, `packages/clinical-engine`, `packages/crdt-sync`, `services/phc-hub` | Core / `@Gauthampro7` | Complete & Verified |
| **Track 2: Field PWA** | `apps/field-pwa` | `@Akarshx-x` | Complete & Merged (`#2`–`#7`, `#15`–`#17`, `#26`, `#30`–`#33`, `#40`, `#41`) |
| **Track 3: Watch Companion** | `apps/watch-companion` | `@aril-travass` | Complete & Merged (`#18`–`#21`, `#34`, `#42`) |
| **Track 4: Local ML Pipeline** | `services/ml-pipeline` | `@Krishnanand-10` & Core (`@Gauthampro7`) | Complete & Merged (`#22`, `T4-07`) |
| **Track 5: Native Android APK** | `apps/android-app` | Core / `@Gauthampro7` | Complete & Verified (`T5-01`, signed APK `v0.1.0`) |

See [TEAM_BOARD.md](./TEAM_BOARD.md) for exact interface contracts, entrypoints, and Definition of Done for each track.

### Atomic Starter Prompts (`prompts/`)

Every feature slice has a self-contained, copy-pasteable prompt for teammates and their AI coding agents — see [`prompts/README.md`](./prompts/README.md) for the dependency DAG and index:

- **Track 1 (`services/phc-hub`)**: [`prompts/track-1-phc-hub/`](./prompts/track-1-phc-hub/)
- **Track 2 (`apps/field-pwa`)**: [`prompts/track-2-field-pwa/`](./prompts/track-2-field-pwa/)
- **Track 3 (`apps/watch-companion`)**: [`prompts/track-3-watch-companion/`](./prompts/track-3-watch-companion/)
- **Track 4 (`services/ml-pipeline`)**: [`prompts/track-4-ml-pipeline/`](./prompts/track-4-ml-pipeline/)
- **Track 5 (`apps/android-app`)**: [`prompts/track-5-android-app/`](./prompts/track-5-android-app/)

---

## 2-Minute Local Quickstart

**Prerequisites**: Python `3.12+` and [`uv`](https://docs.astral.sh/uv/) installed.

```bash
# 1. Clone & install workspace dependencies
git clone https://github.com/Gauthampro7/aarogya-mesh.git
cd aarogya-mesh
uv sync

# 2. Run the full test suite across all workspace packages
make test

# 3. Verify lint, contracts, schemas, and tests together
make verify

# 4. Boot the Tier-2 PHC Hub locally (http://127.0.0.1:8000)
make run-hub
```

Once the Hub is running, inspect:
- `GET http://127.0.0.1:8000/health` — Hub liveness check
- `GET http://127.0.0.1:8000/manifest` — Live host `HardwareCapabilityManifest`
- `GET http://127.0.0.1:8000/docs` — Interactive OpenAPI docs

---

## 3-Minute Winning Hackathon Demo Script (`/showcase` on `:8000`)

Present the entire **3-Tier Offline Mesh** (Watch + Phone + Hub Brain) live on a single port (`:8000`). For the full beat-by-beat stage choreography, Galaxy S23 checklist, 5 Technical Moats, and 36 adversarial judge Q&As, see [docs/JUDGE_QA_AND_PITCH_BIBLE.md](./docs/JUDGE_QA_AND_PITCH_BIBLE.md):

1. **Boot the Unified Stage** (auto-builds `apps/field-pwa` and `apps/watch-companion` bundles if needed):
   ```bash
   make run-hub
   ```
   Open **`http://127.0.0.1:8000/showcase`** (3-Tier Live Interactive Stage) and **`http://127.0.0.1:8000/`** (PHC Command Center).
2. **Prove Airplane-Mode & Pure *Shuddh Tatsama* Hindi (`हिन्दी`)**:
   - Disconnect Wi-Fi / toggle Airplane Mode on the laptop; confirm zero CDN calls and instant local rendering.
   - Click the **`हिन्दी`** toggle on `/showcase` or `/` (and inside the embedded Watch `/watch/` and Phone `/phone/` frames) to show pure *Shuddh Tatsama* Hindi clinical UX.
3. **Interactive Live Watch + Phone -> Hub Sync**:
   - In the left **Tier-0 Watch** bezel (`/watch/`), switch between `CHW_COMPANION` and `PATIENT_FAMILY` modes and tap a danger sign (`RED_EMERGENCY` fires in 0ms locally).
   - In the middle **Tier-1 Phone** frame (`/phone/`), register a patient or run a WHO IMNCI checklist and tap **Sync** — watch the right-hand **Tier-2 PHC Hub Brain** light up live every 2s.
4. **1-Click Real-Data Scenarios (Real CRDT + Enrichment Pipeline)**:
   - **`maternal_sos`**: Watch SOS + Phone ANC visit -> deterministic `RED_EMERGENCY` safety floor + Action Card pushed back to Watch.
   - **`pediatric_voice_offload`**: Phone uploads `.webm` audio blob + `PENDING` voice note -> click **Run Hub Enrichment** -> drains queue, renders SHAP risk bars & `ACTION_CARD_ISSUED`.
   - **`village_outbreak`**: Multi-node spike across Rampur -> triggers EWMA `OUTBREAK_ALERT_RAISED` banner.
   - **`crdt_conflict_merge`**: Concurrent offline edits converge deterministically via HLC `(wall_ms, logical, node_id)` — click **Reset** between takes.

---

## Native Android APK (Phone + Watch Companion on Galaxy S23)

Build and install the standalone offline Android WebView shell (`com.aarogyamesh.app`, bundling `/phone/` + `/watch/` over `127.0.0.1` with native `RECORD_AUDIO`, `VIBRATE`, battery/network bridge, and LAN Hub sync):

```bash
# 1. Build & sign apps/android-app/dist/aarogya-mesh.apk
./apps/android-app/build_apk.sh

# 2. Install & launch on Samsung Galaxy S23 (pass your ADB serial)
adb -s "$ADB_SERIAL" install -r apps/android-app/dist/aarogya-mesh.apk
adb -s "$ADB_SERIAL" shell pm grant com.aarogyamesh.app android.permission.RECORD_AUDIO
adb -s "$ADB_SERIAL" shell am start -W -S -n com.aarogyamesh.app/.MainActivity
```

See [apps/android-app/README.md](./apps/android-app/README.md) for LAN PHC Hub sync details.

---

## Airplane-Mode Demo Script (3-Minute Verification)

Demonstrate full offline autonomy and opportunistic CRDT convergence without internet:

1. **Disconnect Network**: Enable Airplane Mode (or disconnect Wi-Fi) on the demo machine.
2. **Tier-0 / Tier-1 Standalone Triage**: Run deterministic IMNCI / danger-sign triage locally via `packages/clinical-engine` (or `POST /api/v1/triage`). Confirm `RED_EMERGENCY` triggers immediately on any single danger sign (`confidence = 1.0`, zero network required).
3. **Offline Divergence & Voice Note Queueing**: Simulate offline edits on Watch (`CHW_COMPANION` / `PATIENT_FAMILY`) and CHW Phone (`PATIENT_REGISTERED`, `TRIAGE_COMPLETED`, `VOICE_NOTE_RECORDED` with `enrichment_state = PENDING`).
4. **Opportunistic Peer Sync**: Reconnect over local Hotspot/LAN and send `SyncEnvelope` payloads to `POST /api/v1/sync`. Watch `packages/crdt-sync` merge events deterministically via HLC ordering `(wall_ms, logical, node_id)`.
5. **Deferred Tier-2 Enrichment & Sync Back**: Hub processes `GET /api/v1/enrichment/pending` via `services/ml-pipeline`, emits `ENRICHMENT_COMPLETED` + `ACTION_CARD_ISSUED`, and returns the delta `SyncEnvelope` so Watch and Phone converge to identical state (`pending_enrichments == 0`).

---

## Team Onboarding Guide

1. Read [AGENTS.md](./AGENTS.md) (if using an AI coding agent), [TEAM_BOARD.md](./TEAM_BOARD.md), and [CONTRIBUTING.md](./CONTRIBUTING.md).
2. Claim your track (`apps/field-pwa`, `apps/watch-companion`, or `services/ml-pipeline`) via the **Module Claim** GitHub issue template and **assign the Issue to yourself**.
3. Read [ARCHITECTURE.md](./ARCHITECTURE.md) and your module's `MODULE_GUIDE.md` before branching from `origin/main`:
   ```bash
   git fetch origin
   git checkout -b feat/<module>-<short-slug> origin/main
   ```
4. Never edit files outside your assigned module without coordinating first (see [.github/CODEOWNERS](./.github/CODEOWNERS)).
5. Run `make verify` before marking your Pull Request Ready for Review.

---

## How We Proceed: Maintainer & Contributor Playbook

### How Gautham (Core Bedrock Maintainer / Coordinator) Proceeds

1. **Protect `main` on GitHub**: Enable branch protection rules on `main` requiring Pull Requests, passing `CI` workflow checks, and CODEOWNERS/peer review (zero direct pushes to `main`).
2. **Fast-Track Contract & Dependency PRs**: Prioritize and review tiny standalone `packages/contracts` schema bumps or root `pyproject.toml` dependency PRs immediately so no teammate track is ever blocked.
3. **Rapid PR Review & Merge Cadence**: Review and merge small (< 300 LOC) teammate PRs every **2–4 hours** to keep `main` moving smoothly with minimal rebase friction.
4. **Integration & Airplane-Mode Rehearsals**: Coordinate cross-tier integration (Tier-0 Watch -> Tier-1 Field PWA -> Tier-2 PHC Hub + ML Pipeline) and run full Airplane-Mode demo rehearsals leading up to Thursday's final demo.

### Step-by-Step Onboarding & Daily Workflow (Teammates + AI Agents)

1. **One-Time Setup**:
   ```bash
   git clone https://github.com/Gauthampro7/aarogya-mesh.git
   cd aarogya-mesh
   uv sync
   make verify
   ```
2. **Pre-Flight Check (Every Session / Before AI Agent Prompting)**:
   - Run `gh issue list`, `gh pr list`, and `git fetch origin`.
   - Ensure your AI agent reads [AGENTS.md](./AGENTS.md) and works strictly inside your claimed track directory.
3. **Claim & Build Loop (Every 2–4 Hours)**:
   - **Assign** the sub-task GitHub Issue to yourself (never touch an already-assigned Issue).
   - Branch from `origin/main` (`feat/<module>-<slug>`), push your first small commit early, and open a **Draft PR** (**Claim-by-Draft-PR**) so active files are visible to everyone.
   - Implement a focused slice (< 300 LOC) while honoring contract schemas and zero-bloat rules.
   - Escalate any needed contract/dependency change via a tiny standalone PR first.
4. **Verify & Merge**:
   - Run `make verify` locally and rebase onto `origin/main` (`git fetch origin && git rebase origin/main`).
   - Mark the PR **Ready for Review**, merge once CI is green, and delete the short-lived branch.
