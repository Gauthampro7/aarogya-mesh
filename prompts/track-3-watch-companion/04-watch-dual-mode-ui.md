# Track 3 · Slice 04 — Circular 360x360 Dual-Mode Watch UI & Offline Shell

| Field | Value |
| :--- | :--- |
| **Task ID** | `T3-04` |
| **Track & Owner** | Track 3 (`apps/watch-companion`) · `@aril-travass` |
| **Issue / Branch** | Issue `#8` · `feat/watch-dual-mode-ui` |
| **Allowed Paths** | `apps/watch-companion/index.html`, `apps/watch-companion/manifest.webmanifest`, `apps/watch-companion/sw.js`, `apps/watch-companion/src/ui/`, `apps/watch-companion/src/i18n/`, `apps/watch-companion/package.json`, `apps/watch-companion/tests/ui/` |
| **Forbidden Paths** | `packages/`, `services/`, `apps/field-pwa/`, root `pyproject.toml`, `.github/` |
| **Depends On** | `T3-01`, `T3-02`, `T3-03` |

---

## Copy-Paste Starter Prompt

````text
You are working on Aarogya Mesh (`apps/watch-companion/`, Track 3) for Issue #8, Slice 4 of 4.

GOAL:
Wire the completed Watch core (`src/core/`), sync client (`src/sync/`), and rapid triage/reminders (`src/clinical/`) into the circular `360x360` dual-mode Watch Companion UI (`apps/watch-companion/index.html` + `src/ui/`):
1. Dual-Mode Circular Bezel (`360x360`, thumb-operable, high-contrast):
   - Instant mode toggle pill persisted via `WatchStore`:
     - `CHW_COMPANION`: 1-tap danger-sign screen -> immediate `RED_EMERGENCY` alert + 108 referral banner, incoming `ActionCard` list with 1-tap `Acknowledge`, and manual "Sync Now" button + queued-event badge.
     - `PATIENT_FAMILY`: Overdue/due-soon vaccination & medicine reminders, 1-tap SOS trigger (records short voice SOS via `MediaRecorder` if available, else text SOS -> queues `VOICE_NOTE_RECORDED` with `enrichment_state: "PENDING"` + optional audio blob), and emergency 108 guidance.
2. Pure *Shuddh Tatsama* Hindi (`hi`) / English (`en`) toggle in `src/i18n/`:
   - Zero Perso-Arabic loanwords, zero Hinglish, zero nukta characters (U+093C), enforced by `tests/ui/i18n.test.ts` (matching the strict policy in `ARCHITECTURE.md` Section 4).
3. Offline-first PWA shell:
   - Add `esbuild` bundle script (`"build"`) in `apps/watch-companion/package.json`, `manifest.webmanifest`, and a minimal cache-first `sw.js` so the watch UI reloads cleanly in Airplane Mode.
4. Add Vitest tests in `apps/watch-companion/tests/ui/` verifying `i18n` purity (key parity, zero nukta/Perso-Arabic/Hinglish) and dual-mode view state transitions.

CONSTRAINTS:
- ONLY touch Allowed Paths under `apps/watch-companion/`.
- Keep all business/clinical/sync logic inside `src/core/`, `src/sync/`, and `src/clinical/` — `src/ui/` only renders state and dispatches user actions.
- Verify the app works cleanly in Airplane Mode against a local Tier-2 Hub (`http://127.0.0.1:8000`) when reconnected.
````

---

## Step-by-Step Checklist

1. Create `apps/watch-companion/src/i18n/{en,hi,index}.ts` with concise circular-screen labels in English and pure *Shuddh Tatsama* Hindi (e.g., `आपातकाल`, `चिकित्सालय`, `टीकाकरण`, `समन्वय`, `ध्वनि संदेश`, `कार्य सूचना`).
2. Add `esbuild` build script to `apps/watch-companion/package.json` bundling `src/ui/main.ts` -> `dist/watch.js` and load it from `index.html` (replacing the placeholder inline `<script>`).
3. Implement `src/ui/` views inside the `360x360` circular bezel: mode switch (`CHW_COMPANION` / `PATIENT_FAMILY`), language toggle (`EN` / `हिं`), 1-tap danger-sign screen, `ActionCard` list + ack, voice/text SOS recorder, and Hub URL + `Sync Now` status pill.
4. Add `manifest.webmanifest` and `sw.js` precaching the watch shell for Airplane-Mode reload.
5. Add `apps/watch-companion/tests/ui/i18n.test.ts` enforcing zero Perso-Arabic/Hinglish/nukta words and verify `npm run typecheck && npm test && npm run build`.

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
- `360x360` circular Watch UI switches cleanly between `CHW_COMPANION` and `PATIENT_FAMILY` and persists state across offline reloads.
- 1-tap danger sign emits `RED_EMERGENCY` immediately offline; SOS queues `VOICE_NOTE_RECORDED (PENDING)`; reconnecting syncs events & blobs with `services/phc-hub` (`POST /api/v1/sync` + `PUT /api/v1/blobs/{blob_key}`).
- Pure *Shuddh Tatsama* Hindi guard test passes with zero violations, and `make verify` passes.
