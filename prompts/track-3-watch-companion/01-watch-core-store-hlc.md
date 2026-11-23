# Track 3 · Slice 01 — Watch Core Event Store, HLC & Mode State

| Field | Value |
| :--- | :--- |
| **Task ID** | `T3-01` |
| **Track & Owner** | Track 3 (`apps/watch-companion`) · `@aril-travass` |
| **Issue / Branch** | Issue `#8` · `feat/watch-core-store-hlc` |
| **Allowed Paths** | `apps/watch-companion/src/core/`, `apps/watch-companion/src/watch_kernel.ts`, `apps/watch-companion/tests/core/`, `apps/watch-companion/package.json`, `apps/watch-companion/tsconfig.json` |
| **Forbidden Paths** | `packages/`, `services/`, `apps/field-pwa/`, root `pyproject.toml`, `.github/` |
| **Depends On** | None (foundation slice for Track 3 — start here first!) |

---

## Copy-Paste Starter Prompt

````text
You are working on Aarogya Mesh (`apps/watch-companion/`, Track 3) for Issue #8, Slice 1 of 4.

GOAL:
Build a clean, UI-free, persistent core kernel under `apps/watch-companion/src/core/` so the Tier-0 Watch operates 100% standalone offline across browser reloads:
1. `src/core/hlc.ts`: Deterministic Hybrid Logical Clock (`tickHlc`, `receiveHlc`, `compareHlc`) matching `packages/contracts/ts/index.ts` `HlcTimestamp` (`wall_ms`, `logical`, `node_id`) with strict monotonicity and total ordering `(wall_ms, logical, node_id)`.
2. `src/core/store.ts`: Persistent `WatchStore` backed by `Storage` (`localStorage` with an injectable in-memory fallback for Node/Vitest tests) storing:
   - Append-only `CrdtEvent[]` deduplicated by `event_id`
   - Pending outbox `event_id`s not yet acknowledged by a peer
   - Last peer `syncCursor: string | null`
   - Persisted `watchMode: WatchMode` (`"CHW_COMPANION" | "PATIENT_FAMILY"`) and `nodeId`
   - Materialized `ActionCard[]` with LWW per-field merge by HLC (so `ACKNOWLEDGED` / `COMPLETED` never regresses to `OPEN`) and filtering by active `watch_mode` (`card.watch_mode === null || card.watch_mode === activeMode`), sorted `OPEN` first then `CRITICAL -> HIGH -> MEDIUM -> LOW`.
3. Add Vitest dev tooling in `apps/watch-companion/package.json` (`"test": "vitest run"`) and unit tests in `apps/watch-companion/tests/core/watch_store.test.ts` covering HLC monotonicity/merge, reload persistence, idempotent dedup, and ActionCard LWW status + `watch_mode` filtering.

CONSTRAINTS:
- Import ALL domain types strictly from `../../../packages/contracts/ts/index` (or `../../../../packages/contracts/ts/index` inside `src/core/`). Never duplicate contract interfaces.
- ONLY touch Allowed Paths under `apps/watch-companion/`. Do NOT build UI screens in this slice (UI is Slice 04).
- Keep the PR focused (<300 LOC of source code).
````

---

## Step-by-Step Checklist

1. Add `vitest` to `apps/watch-companion/package.json` (`devDependencies` + `"test": "vitest run"`) and ensure `tsconfig.json` includes `src/**/*.ts` and `tests/**/*.ts`.
2. Create `apps/watch-companion/src/core/hlc.ts` with `tickHlc()`, `receiveHlc(remote)`, and `compareHlc(a, b)` matching `packages/crdt-sync/src/aarogya_crdt_sync/hlc.py`.
3. Create `apps/watch-companion/src/core/store.ts` implementing `WatchStore` with injectable storage adapter, append-only event dedup, outbox tracking, persisted `WatchMode` toggle, and LWW `ActionCard` projection.
4. Export `src/core/index.ts` and refactor `src/watch_kernel.ts` to delegate HLC/store state cleanly (preserving existing `WatchKernel` exports).
5. Write `apps/watch-companion/tests/core/watch_store.test.ts` proving reload durability, HLC receive monotonicity, duplicate event idempotency, and `CHW_COMPANION` vs `PATIENT_FAMILY` card filtering.

---

## Verification Commands & Definition of Done

```bash
cd apps/watch-companion
npm install
npm run typecheck
npm test
cd ../..
make verify
```

**Definition of Done**:
- `src/core/` has zero DOM dependencies and runs cleanly in Vitest under Node.
- Events, cursors, `ActionCard`s, and `WatchMode` survive store re-instantiation on the same storage adapter.
- `npm run typecheck`, `npm test`, and root `make verify` all pass.
