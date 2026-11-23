# Track 3 · Slice 02 — Watch Peer Delta Sync & Voice Blob Upload

| Field | Value |
| :--- | :--- |
| **Task ID** | `T3-02` |
| **Track & Owner** | Track 3 (`apps/watch-companion`) · `@aril-travass` |
| **Issue / Branch** | Issue `#8` · `feat/watch-sync-and-blobs` |
| **Allowed Paths** | `apps/watch-companion/src/sync/`, `apps/watch-companion/tests/sync/` |
| **Forbidden Paths** | `packages/`, `services/`, `apps/field-pwa/`, root `pyproject.toml`, `.github/` |
| **Depends On** | `T3-01` (`01-watch-core-store-hlc.md`) |

---

## Copy-Paste Starter Prompt

````text
You are working on Aarogya Mesh (`apps/watch-companion/`, Track 3) for Issue #8, Slice 2 of 4.

CONTEXT:
- Tier-2 PHC Hub (`services/phc-hub/src/aarogya_phc_hub/app.py`) exposes:
  - `POST /api/v1/sync` (accepts & returns strict `SyncEnvelope` JSON from `packages/contracts/ts/index.ts`)
  - `WS /ws/mesh` (optional live delta-sync WebSocket)
  - `HEAD /api/v1/blobs/{blob_key}` (`200` exists / `404` missing)
  - `PUT /api/v1/blobs/{blob_key}` (raw binary body + `Content-Type` header; `blob_key` matches `^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$`, no `..`)
- `HardwareCapabilityManifest` on Tier-0 Watch MUST set `tier: "TIER_0_WATCH"` and `watch_mode: "CHW_COMPANION" | "PATIENT_FAMILY"` (never `null`).

GOAL:
Build a decoupled, fail-soft sync layer under `apps/watch-companion/src/sync/`:
1. `src/sync/client.ts`: `WatchSyncClient` taking `WatchStore`, `hubUrl` (default `"http://127.0.0.1:8000"`), and injectable `fetchImpl`:
   - `syncNow()` builds a schema-valid `SyncEnvelope` (`schema_version: CONTRACT_SCHEMA_VERSION`, `sender_manifest` with `TIER_0_WATCH`, `sender_hlc`, `since_cursor`, pending outbox `events`), uploads any pending SOS voice blobs via `HEAD` + `PUT /api/v1/blobs/{audio_blob_key}`, POSTs to `/api/v1/sync`, merges `response.sender_hlc` + event HLCs into the local clock, marks `ack_event_ids` synced, applies incoming `events` (including Hub `ACTION_CARD_ISSUED` cards), and persists `next_cursor`.
   - `ackActionCard(cardId)` appends a local `ACTION_CARD_ISSUED` event with `{ card_id, status: "ACKNOWLEDGED" }` offline so the watch works with zero network and syncs the ack opportunistically.
   - Strictly fail-soft: network timeout/offline/5xx NEVER throws unhandled errors or drops queued events; returns structured `{ ok: false, status: "offline" | "error", reason }`.
2. Unit tests in `apps/watch-companion/tests/sync/watch_sync.test.ts` with mocked `fetch` testing full roundtrip sync, idempotent duplicate replay, `HEAD 404 -> PUT` vs `HEAD 200` blob dedup, offline resilience, and card ack persistence.

CONSTRAINTS:
- Import contract types exclusively from `../../../../packages/contracts/ts/index`.
- ONLY touch Allowed Paths under `apps/watch-companion/`. No DOM/UI code in `src/sync/`.
````

---

## Step-by-Step Checklist

1. Create `apps/watch-companion/src/sync/blobs.ts` implementing `uploadWatchBlobIfMissing(hubUrl, blobKey, blob, fetchImpl)` with `HEAD` check before `PUT`.
2. Create `apps/watch-companion/src/sync/client.ts` implementing `WatchSyncClient` (`syncNow()`, `ackActionCard()`, `enqueueVoiceSos()`).
3. Ensure `SyncEnvelope` validation checks required keys before applying a reply so malformed network responses never corrupt `WatchStore`.
4. Add `apps/watch-companion/tests/sync/watch_sync.test.ts` covering happy-path delta sync, `ActionCard` ingestion + ack roundtrip, voice blob `HEAD`/`PUT`, and Airplane-Mode offline fallback.

---

## Verification Commands & Definition of Done

```bash
cd apps/watch-companion
npm run typecheck
npm test
cd ../..
make verify
```

**Definition of Done**:
- `WatchSyncClient.syncNow()` speaks strict `SyncEnvelope` v1.0.0 compatible with `POST /api/v1/sync` and `PUT/HEAD /api/v1/blobs/{blob_key}`.
- Offline failures leave the outbox untouched and retry cleanly when connectivity returns.
- `npm run typecheck`, `npm test`, and root `make verify` all pass.
