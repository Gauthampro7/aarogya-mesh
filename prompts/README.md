# Aarogya Mesh — Atomic Task-Prompt System

This directory holds **decoupled, single-slice starter prompts** for every track in **Aarogya Mesh**. Each file scopes exactly one small, independently testable PR (`<300 LOC`) so teammates and AI coding agents never build monoliths, never step on another track's files, and never drift from `packages/contracts/`.

---

## 1. Atomic Prompt Contract

Every prompt file under `prompts/track-*/` follows four rules:

1. **One Slice = One Issue = One Small PR (`<300 LOC`)**: Never combine two numbered files into a single branch or PR.
2. **Strict Path Isolation**: Every prompt declares explicit **Allowed Paths** and **Forbidden Paths**. Do not edit files outside Allowed Paths. Need a contract or root dependency bump? Open a tiny standalone PR first (see [CONTRIBUTING.md](../CONTRIBUTING.md)).
3. **Claim Before Coding**:
   - Run `gh issue list` and `gh pr list` first.
   - Assign the slice's GitHub Issue to yourself, cut a fresh branch from `origin/main`, and open a **Draft PR** after your first small commit.
4. **Copy-Paste Ready**: Paste the fenced **Copy-Paste Starter Prompt** block directly into your AI coding agent (Antigravity, Cursor, Claude Code, Copilot, etc.) after pointing it at [AGENTS.md](../AGENTS.md). Every slice ends with `make verify` (plus track-specific checks).

---

## 2. Track & Slice Index

### Track 1 — Tier-2 PHC Hub (`services/phc-hub/`, Core Bedrock)
| Slice | File | Scope | Depends On |
| :--- | :--- | :--- | :--- |
| `T1-01` | [track-1-phc-hub/01-enrichment-worker-loop.md](./track-1-phc-hub/01-enrichment-worker-loop.md) | Background enrichment worker polling `pending_enrichments`, fetching audio from `LocalBlobStore`, invoking `ml-pipeline` protocols + deterministic safety floor | None (uses `Stub*` defaults; upgrades automatically with `T4-05`) |
| `T1-02` | [track-1-phc-hub/02-mdns-peer-discovery.md](./track-1-phc-hub/02-mdns-peer-discovery.md) | `zeroconf` mDNS `_aarogya-mesh._tcp.local.` advertisement, `GET /api/v1/peers`, offline LAN/QR Hotspot connect helper | None |
| `T1-03` | [track-1-phc-hub/03-phc-command-center-ui.md](./track-1-phc-hub/03-phc-command-center-ui.md) | Offline Tier-2 PHC Command Center dashboard (peer topology, manifests, SHAP risk, outbreak alerts, CRDT HLC log inspector) | `T1-01`, `T1-02` |

### Track 2 — Tier-1 CHW Field PWA (`apps/field-pwa/`, `@Akarshx-x`)
| Slice | File | Scope | Issue / Depends On |
| :--- | :--- | :--- | :--- |
| `T2-01` | [track-2-field-pwa/01-cleanup-and-lockfile.md](./track-2-field-pwa/01-cleanup-and-lockfile.md) | Remove unused legacy `src/sync_client.ts` & refresh cross-platform `package-lock.json` for Linux `npm ci` | Issue `#9` / None |
| `T2-02` | [track-2-field-pwa/02-voice-blob-sync.md](./track-2-field-pwa/02-voice-blob-sync.md) | Upload IndexedDB `aarogya-field-audio` blobs to Hub `PUT /api/v1/blobs/{audio_blob_key}` with `HEAD` dedup | Issue `#11` / `T2-01` |
| `T2-03` | [track-2-field-pwa/03-hindi-rule-labels.md](./track-2-field-pwa/03-hindi-rule-labels.md) | Pure *Shuddh Tatsama* Hindi labels for IMNCI/ANC/PNC rules enforced by `tests/ui/i18n.test.ts` | Issue `#10` / `T2-01` |

### Track 3 — Tier-0 Dual-Mode Watch Companion (`apps/watch-companion/`, `@aril-travass`)
| Slice | File | Scope | Issue / Depends On |
| :--- | :--- | :--- | :--- |
| `T3-01` | [track-3-watch-companion/01-watch-core-store-hlc.md](./track-3-watch-companion/01-watch-core-store-hlc.md) | Persistent local event store + monotonic `HlcClock` + `WatchMode` state in `src/core/` (UI-independent) | Issue `#8` / None |
| `T3-02` | [track-3-watch-companion/02-watch-sync-and-blobs.md](./track-3-watch-companion/02-watch-sync-and-blobs.md) | Peer `SyncEnvelope` exchange (`POST /api/v1/sync`) + `PUT/HEAD /api/v1/blobs/{blob_key}` audio upload | Issue `#8` / `T3-01` |
| `T3-03` | [track-3-watch-companion/03-watch-rapid-triage-and-reminders.md](./track-3-watch-companion/03-watch-rapid-triage-and-reminders.md) | 1-tap deterministic red-flag screening emitting strict `TriageAssessment` + vaccination/medication reminders | Issue `#8` / `T3-01` |
| `T3-04` | [track-3-watch-companion/04-watch-dual-mode-ui.md](./track-3-watch-companion/04-watch-dual-mode-ui.md) | Circular `360x360` dual-mode UI (`CHW_COMPANION` / `PATIENT_FAMILY`), SOS voice recorder, *Shuddh Tatsama* Hindi, SW | Issue `#8` / `T3-02`, `T3-03` |

### Track 4 — Tier-2 Local Edge ML Pipeline (`services/ml-pipeline/`, `@Krishnanand-10`)
| Slice | File | Scope | Depends On |
| :--- | :--- | :--- | :--- |
| `T4-01` | [track-4-ml-pipeline/01-whisper-asr-backend.md](./track-4-ml-pipeline/01-whisper-asr-backend.md) | `WhisperVoiceTranscriber` (`faster-whisper`/`whisper.cpp` INT8 CPU, zero PyTorch/CUDA, stub fallback) | None |
| `T4-02` | [track-4-ml-pipeline/02-slm-gbnf-structurer.md](./track-4-ml-pipeline/02-slm-gbnf-structurer.md) | `LlamaCppSlmStructurer` (`Qwen2.5-3B` Q4 GGUF + GBNF JSON grammar; never overrides `TriageSeverity`) | None |
| `T4-03` | [track-4-ml-pipeline/03-lightgbm-shap-risk.md](./track-4-ml-pipeline/03-lightgbm-shap-risk.md) | `LightGbmRiskScorer` (CPU LightGBM + SHAP `TreeExplainer`, synthetic trainer, stub fallback) | None |
| `T4-04` | [track-4-ml-pipeline/04-ewma-outbreak-detector.md](./track-4-ml-pipeline/04-ewma-outbreak-detector.md) | `EwmaOutbreakDetector` (deterministic EWMA spatiotemporal surge detection per `(village_id, syndrome)`) | None |
| `T4-05` | [track-4-ml-pipeline/05-enrichment-orchestrator.md](./track-4-ml-pipeline/05-enrichment-orchestrator.md) | `EnrichmentPipeline` composing all 4 protocols + deterministic `evaluate_triage` hard safety floor | `T4-01`–`T4-04` |

---

## 3. Parallel Execution Dependency DAG

All four tracks run **100% in parallel** because every cross-track boundary is locked to `packages/contracts/`. Within each track, arrows indicate strict ordering; unlinked nodes can be implemented concurrently.

```mermaid
flowchart LR
    subgraph T1["Track 1: PHC Hub"]
        T1_01["T1-01 Enrichment Worker"]
        T1_02["T1-02 mDNS Peer Discovery"]
        T1_03["T1-03 PHC Command Center UI"]
        T1_01 --> T1_03
        T1_02 --> T1_03
    end

    subgraph T2["Track 2: Field PWA"]
        T2_01["T2-01 Cleanup & Lockfile"]
        T2_02["T2-02 Voice Blob Sync"]
        T2_03["T2-03 Shuddh Hindi Rules"]
        T2_01 --> T2_02
        T2_01 --> T2_03
    end

    subgraph T3["Track 3: Watch Companion"]
        T3_01["T3-01 Core Store & HLC"]
        T3_02["T3-02 Sync & Blobs"]
        T3_03["T3-03 Rapid Triage & Reminders"]
        T3_04["T3-04 Dual-Mode 360x360 UI"]
        T3_01 --> T3_02
        T3_01 --> T3_03
        T3_02 --> T3_04
        T3_03 --> T3_04
    end

    subgraph T4["Track 4: ML Pipeline"]
        T4_01["T4-01 Whisper INT8 ASR"]
        T4_02["T4-02 LlamaCpp GBNF SLM"]
        T4_03["T4-03 LightGBM + SHAP"]
        T4_04["T4-04 EWMA Outbreak"]
        T4_05["T4-05 EnrichmentPipeline"]
        T4_01 --> T4_05
        T4_02 --> T4_05
        T4_03 --> T4_05
        T4_04 --> T4_05
    end

    T4_05 -. "optional drop-in upgrade" .-> T1_01
    T2_02 -. "uploads audio blobs to" .-> T1_01
    T3_02 -. "syncs envelopes & blobs to" .-> T1_01
```
