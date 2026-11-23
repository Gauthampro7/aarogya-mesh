# Track 2 · Slice 02 — Voice Audio Blob Sync to Tier-2 Hub

| Field | Value |
| :--- | :--- |
| **Task ID** | `T2-02` |
| **Track & Owner** | Track 2 (`apps/field-pwa`) · `@Akarshx-x` |
| **Issue / Branch** | Issue `#11` · `feat/field-pwa-voice-blob-sync` |
| **Allowed Paths** | `apps/field-pwa/src/sync/`, `apps/field-pwa/src/ui/audio_store.ts`, `apps/field-pwa/tests/sync/` |
| **Forbidden Paths** | `packages/`, `services/`, `apps/watch-companion/`, root config files |
| **Depends On** | None (Hub `PUT/HEAD/GET /api/v1/blobs/{blob_key}` is already live on `main`) |

---

## Copy-Paste Starter Prompt

````text
You are working on Aarogya Mesh (`apps/field-pwa/`, Track 2) for Issue #11.

CONTEXT:
- `apps/field-pwa/src/ui/screens/voice.ts` stores recorded voice clips in IndexedDB database `"aarogya-field-audio"` (store `"blobs"`) via `src/ui/audio_store.ts` (`putAudio` / `getAudio`), then enqueues a `VOICE_NOTE_RECORDED` CrdtEvent (`enrichment_state: "PENDING"`) with `payload.audio_blob_key` (format `vn-<uuid>`) and `payload.mime_type`.
- Tier-2 PHC Hub (`services/phc-hub/src/aarogya_phc_hub/app.py`) already exposes:
  - `HEAD /api/v1/blobs/{blob_key}` -> `200` if present, `404` if missing
  - `PUT /api/v1/blobs/{blob_key}` (raw binary body + `Content-Type` header) -> `200` JSON `BlobMetadata { blob_key, content_type, size_bytes, sha256 }`
  - `blob_key` must match `^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$` without `..` (max 25 MiB).

GOAL:
1. Add a focused blob-upload helper (e.g. `apps/field-pwa/src/sync/transport-blobs.ts`) that:
   - Accepts a `hubUrl`, `blobKey`, `Blob`, and injectable `fetchImpl`.
   - Checks `HEAD /api/v1/blobs/{blob_key}` first; if `200`, skips upload (idempotent dedup).
   - If `404`, uploads raw bytes via `PUT /api/v1/blobs/{blob_key}` with `Content-Type: blob.type || "application/octet-stream"` and `cache: "no-store"`.
2. Wire opportunistic blob upload into `SyncEngine` (`apps/field-pwa/src/sync/engine.ts`) before or alongside `POST /api/v1/sync` for any pending `VOICE_NOTE_RECORDED` event carrying a non-null `payload.audio_blob_key`:
   - Read the blob via `getAudio(blobKey)` (injectable loader in `SyncEngineOptions` for clean unit testing).
   - Strictly fail-soft: if offline, missing blob, or upload returns non-2xx, NEVER block local capture or crash `syncNow()`; keep retrying on subsequent syncs until uploaded.
3. Add Vitest unit tests under `apps/field-pwa/tests/sync/` verifying:
   - `HEAD 404` -> `PUT` uploads exact bytes + `Content-Type`.
   - `HEAD 200` -> skips redundant `PUT`.
   - Offline/500 failure -> fail-soft, no throw, retries cleanly on next `syncNow()`.

CONSTRAINTS:
- ONLY touch Allowed Paths under `apps/field-pwa/`.
- Do NOT embed base64 audio bytes inside `CrdtEvent.payload` (keep event log lightweight).
- Preserve the Autonomy Invariant: local voice capture works 100% offline with zero RPC coupling.
````

---

## Step-by-Step Checklist

1. Create `apps/field-pwa/src/sync/transport-blobs.ts` implementing `headBlob` and `uploadBlobIfMissing` with timeout + `SyncTransportError` classification (`"offline"` vs `"error"`).
2. Add an optional `getAudioBlob?: (key: string) => Promise<Blob | undefined>` hook in `SyncEngineOptions` (defaulting to `getAudio` from `../ui/audio_store`) so tests stay isolated without real DOM media.
3. In `SyncEngine.syncNow()` (and `pushViaMesh()`), inspect pending `VOICE_NOTE_RECORDED` events for non-null `payload.audio_blob_key` and upload missing blobs via `uploadBlobIfMissing` before pushing the `SyncEnvelope` (so the Hub enrichment worker can read the audio immediately upon receiving the event).
4. Handle upload errors fail-soft: if a blob upload fails while offline, report `"offline"` / `"error"` status without losing outbox events or crashing `SyncEngine`.
5. Add unit tests in `apps/field-pwa/tests/sync/` covering `HEAD 404 -> PUT`, `HEAD 200` skip, typed-only notes (`audio_blob_key: null`), and network failure retry.

---

## Verification Commands & Definition of Done

```bash
cd apps/field-pwa
npm run typecheck
npm test
npm run build
cd ../..
make verify
```

**Definition of Done**:
- Pending `VOICE_NOTE_RECORDED` blobs upload idempotently (`HEAD` check -> `PUT /api/v1/blobs/{audio_blob_key}`).
- Typed-only voice notes (`audio_blob_key: null`) make zero blob HTTP calls.
- Offline/server failures are 100% fail-soft and retry cleanly on the next sync.
- `npm run typecheck`, `npm test`, `npm run build`, and `make verify` all pass.
