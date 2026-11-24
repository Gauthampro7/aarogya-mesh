# Track 3 · Slice 06 — Persistent IndexedDB Queue for Pending SOS Audio Blobs

| Field | Value |
| :--- | :--- |
| **Task ID** | `T3-06` |
| **Track & Owner** | Track 3 (`apps/watch-companion`) · Travis (`@aril-travass`) |
| **Issue / Branch** | Closes `#24` · `feat/watch-indexeddb-blob-queue` |
| **Difficulty / Priority** | Middle · Offline Durability Fix |
| **Allowed Paths** | `apps/watch-companion/src/sync/blob_queue.ts` (new), `apps/watch-companion/src/sync/client.ts`, `apps/watch-companion/src/sync/index.ts`, `apps/watch-companion/src/ui/main.ts`, `apps/watch-companion/package.json`, `apps/watch-companion/package-lock.json`, `apps/watch-companion/tests/sync/` |
| **Forbidden Paths** | `packages/`, `services/`, `apps/field-pwa/`, `apps/android-app/`, `apps/watch-companion/src/clinical/*`, `apps/watch-companion/src/i18n/*`, root `pyproject.toml`, `.github/` |
| **Depends On** | `T3-02` (merged on `main`); independent of `T3-05` (only touches `blobQueue` default in `client.ts` / `main.ts`) |

---

## Copy-Paste Starter Prompt

````text
You are working on Aarogya Mesh (`apps/watch-companion/`, Track 3) to close GitHub Issue #24 (`T3-06`).
Read `AGENTS.md` and inspect `apps/watch-companion/src/sync/{client,blobs,index}.ts`, `apps/watch-companion/src/ui/main.ts`, and `apps/field-pwa/src/ui/audio_store.ts` (for clean IndexedDB pattern reference) BEFORE editing.

PROBLEM (Issue #24):
- Today `WatchSyncClient` (`src/sync/client.ts:164`) defaults `this.blobQueue = opts.blobQueue ?? new MemoryWatchBlobQueue()`.
- While `VOICE_NOTE_RECORDED` CRDT events persist in `localStorage` (`WatchStore`), the raw SOS audio bytes stored in `MemoryWatchBlobQueue` are LOST if the browser tab, PWA, or Android WebView reloads before `syncNow()` uploads them to the Tier-2 Hub (`PUT /api/v1/blobs/{audio_blob_key}`)!
- `WatchBlobQueue` in `src/sync/client.ts:27-31` ALREADY has async-ready method signatures:
  ```ts
  export interface WatchBlobQueue {
    get(blobKey: string): QueuedWatchBlob | undefined | Promise<QueuedWatchBlob | undefined>;
    set(blobKey: string, entry: QueuedWatchBlob): void | Promise<void>;
    delete(blobKey: string): void | Promise<void>;
  }
  ```

CRITICAL INVARIANTS (NEVER VIOLATE):
1. Autonomy & Offline Durability: Queued SOS audio blobs MUST survive full tab/WebView reloads offline until `syncNow()` receives `ack_event_ids` for the referencing `VOICE_NOTE_RECORDED` event (existing cleanup logic at `client.ts:445-456`).
2. Zero Breakage in Node / Vitest / Private Browsing: When `indexedDB` is unavailable or throws (`SecurityError` / quota / Node without polyfill), `createDefaultWatchBlobQueue()` MUST fall back silently to `MemoryWatchBlobQueue` — NEVER crash `WatchSyncClient` construction!
3. Keep `MemoryWatchBlobQueue` exported from `src/sync/index.ts` so all existing unit tests remain 100% compatible.
4. Binary Fidelity: Preserve both `Blob` and `Uint8Array` payloads + `contentType` cleanly across IndexedDB roundtrips (convert stored `ArrayBuffer` / `Uint8Array` / `Blob` safely on read so `uploadWatchBlobIfMissing` receives exact bytes and exact `contentType`).
5. Strict Path Isolation: ONLY edit files in Allowed Paths under `apps/watch-companion/`. Do NOT touch `packages/`, `services/`, `apps/field-pwa/`, or `apps/android-app/`.

OBJECTIVES:

### 1. Implement `IndexedDbWatchBlobQueue` (`apps/watch-companion/src/sync/blob_queue.ts`)
- Implement `export class IndexedDbWatchBlobQueue implements WatchBlobQueue`:
  - Database name: `"aarogya-watch-blobs"` (version `1`), object store name: `"blobs"`.
  - Constructor accepts optional `{ dbName?: string; factory?: IDBFactory }` (defaulting `factory` to `globalThis.indexedDB`) so Vitest tests can inject `fake-indexeddb` with isolated DB names.
  - `set(blobKey, entry)`: stores `{ bytes: Uint8Array | Blob, contentType: string }` (note: converting `Blob` via `await blob.arrayBuffer()` -> `Uint8Array`, or storing `Uint8Array` directly, guarantees 100% cross-browser & `fake-indexeddb` structured-clone reliability even in environments where `Blob` cloning is flaky!).
  - `get(blobKey)`: reads the record and returns `{ blob: new Uint8Array(record.bytes), contentType: record.contentType }` (or `Blob` if stored as `Blob`), returning `undefined` when missing.
  - `delete(blobKey)`: deletes the key cleanly (idempotent if already absent).
  - Always closes `db.close()` in `finally` blocks (or manages a single cleanly closed connection) so IndexedDB version upgrades / test teardown never hang.
  - Guard all IndexedDB open/transaction failures gracefully so callers never see unhandled rejections when storage is blocked.
- Export `export function createDefaultWatchBlobQueue(factory?: IDBFactory): WatchBlobQueue`:
  - Returns `new IndexedDbWatchBlobQueue({ factory })` when `factory ?? globalThis.indexedDB` is available; otherwise returns `new MemoryWatchBlobQueue()`.

### 2. Wire Default Persistent Queue into `WatchSyncClient` & Browser Entrypoint
- Re-export `IndexedDbWatchBlobQueue` and `createDefaultWatchBlobQueue` from `src/sync/index.ts`.
- In `src/sync/client.ts`: keep `opts.blobQueue ?? createDefaultWatchBlobQueue()` (so browser/WebView sessions automatically persist SOS blobs in IndexedDB while Node Vitest without `indexedDB` automatically uses `MemoryWatchBlobQueue` unless `fake-indexeddb` is injected!).
- In `src/ui/main.ts`: pass `blobQueue: createDefaultWatchBlobQueue()` explicitly to `WatchSyncClient` (making browser persistence crystal clear).

### 3. Add Comprehensive Reload-Survival Tests (`apps/watch-companion/tests/sync/`)
- Add `"fake-indexeddb": "^6.0.0"` to `devDependencies` in `apps/watch-companion/package.json` (matching `apps/field-pwa/package.json`) and refresh `apps/watch-companion/package-lock.json`.
- Create `apps/watch-companion/tests/sync/blob_queue.test.ts` testing:
  1. `IndexedDbWatchBlobQueue`: `set` -> `get` -> exact byte-for-byte & `contentType` match -> `delete` -> `undefined`.
  2. **Full Tab Reload Simulation**:
     - Instance 1 (`WatchStore` on shared `MemoryStorage` + `WatchSyncClient` with `IndexedDbWatchBlobQueue` on `fake-indexeddb`): call `enqueueVoiceSos({ audioBlob: new Uint8Array([1, 2, 3, 4]), mimeType: "audio/webm", durationMs: 2500 })` while offline (`syncNow()` fails with network error).
     - Discard Instance 1 completely and construct Instance 2 (`new WatchStore(...)` on the same storage + `new WatchSyncClient(...)` on a **brand-new** `IndexedDbWatchBlobQueue` pointing to the same `fake-indexeddb` DB!).
     - Call `instance2.syncNow()` with a mock `fetch` -> verify `HEAD /api/v1/blobs/<key>` (404) -> `PUT /api/v1/blobs/<key>` uploads the exact `[1, 2, 3, 4]` bytes with `Content-Type: audio/webm` -> `POST /api/v1/sync` returns `ack_event_ids` -> verify `blobQueue.get(key)` is now `undefined` (cleaned up after ack)!
  3. **Fallback Guard**: `createDefaultWatchBlobQueue(undefined)` in a scope with no `indexedDB` returns `MemoryWatchBlobQueue` without throwing.
````

---

## Step-by-Step Checklist

1. Add `"fake-indexeddb": "^6.0.0"` to `apps/watch-companion/package.json` `devDependencies` and install (`npm install`).
2. Create `apps/watch-companion/src/sync/blob_queue.ts` implementing `IndexedDbWatchBlobQueue` and `createDefaultWatchBlobQueue()`.
3. Export both from `apps/watch-companion/src/sync/index.ts` and wire `createDefaultWatchBlobQueue()` in `src/sync/client.ts` and `src/ui/main.ts`.
4. Write `apps/watch-companion/tests/sync/blob_queue.test.ts` proving offline SOS blob survival across simulated full tab reload + post-ack cleanup + graceful `MemoryWatchBlobQueue` fallback.
5. Run typecheck, tests, esbuild bundle, and root `make verify`.

---

## Verification Commands & Definition of Done

```bash
cd apps/watch-companion
npm run typecheck
npm test
npm run build
cd ../..
make verify
```

**Definition of Done**:
- Pending SOS voice blobs persist in IndexedDB (`aarogya-watch-blobs`) across full browser/WebView reloads and upload via `HEAD` -> `PUT /api/v1/blobs/{blob_key}` once connectivity returns.
- Blobs are removed from IndexedDB only after the referencing `VOICE_NOTE_RECORDED` event is acknowledged by the Hub.
- Environments without `indexedDB` fall back cleanly to `MemoryWatchBlobQueue` with zero errors.
- `npm run typecheck`, `npm test`, `npm run build` (`dist/watch.js`), and `make verify` all pass.
- Issue `#24` is ready to close via `Closes #24` in the PR description.
