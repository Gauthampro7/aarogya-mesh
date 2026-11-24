# Track 3 · Slice 05 — Auto-Origin Hub URL, In-Place Timer & Circular Bezel UX Polish

| Field | Value |
| :--- | :--- |
| **Task ID** | `T3-05` |
| **Track & Owner** | Track 3 (`apps/watch-companion`) · Travis (`@aril-travass`) |
| **Difficulty / Priority** | Middle · Hackathon Showcase & Field Polish Sprint |
| **Branch** | `feat/watch-origin-bezel-ux` |
| **Allowed Paths** | `apps/watch-companion/src/sync/client.ts`, `apps/watch-companion/src/ui/main.ts`, `apps/watch-companion/src/ui/render.ts`, `apps/watch-companion/src/ui/state.ts`, `apps/watch-companion/src/i18n/en.ts`, `apps/watch-companion/src/i18n/hi.ts`, `apps/watch-companion/index.html`, `apps/watch-companion/tests/sync/`, `apps/watch-companion/tests/ui/` |
| **Forbidden Paths** | `packages/`, `services/`, `apps/field-pwa/`, `apps/android-app/`, `apps/watch-companion/src/clinical/*` (keep deterministic danger-sign triage intact), root `pyproject.toml`, `.github/` |
| **Depends On** | `T3-01`..`T3-04` (all merged on `main`) |

---

## Copy-Paste Starter Prompt

````text
You are working on Aarogya Mesh (`apps/watch-companion/`, Track 3) for Task `T3-05`.
Read `AGENTS.md` and inspect `src/sync/client.ts`, `src/ui/{main,render,state}.ts`, `src/i18n/{en,hi}.ts`, and `index.html` BEFORE editing.

CRITICAL INVARIANTS (NEVER VIOLATE):
1. Autonomy Invariant: Watch works 100% standalone offline (`WatchStore` in `localStorage`). Network failures remain strictly fail-soft.
2. Clinical Safety Floor: NEVER weaken `WatchKernel.screenDangerSigns` or `evaluateWatchDangerScreen` (`RED_EMERGENCY` + `referral_required: true` for every danger sign, strict `TriageAssessment` keys with zero extra properties).
3. Pure Indigenous Indic Vocabulary (`ARCHITECTURE.md` Section 4): EVERY string in `src/i18n/hi.ts` MUST be pure *Shuddh Tatsama* Devanagari with exact key parity against `src/i18n/en.ts`, ZERO Perso-Arabic loanwords, ZERO Hinglish transliterations, and ZERO nukta characters (U+093C). Enforced by `tests/ui/i18n.test.ts`!
4. Zero `innerHTML` / zero external CDNs: use `document.createElement` / `textContent` only.
5. Strict Path Isolation: ONLY edit files in Allowed Paths under `apps/watch-companion/`. Do NOT touch `packages/`, `services/`, `apps/field-pwa/`, or `apps/android-app/`.

OBJECTIVES — IMPLEMENT ALL 6 TARGETED FIXES:

### 1. Auto-Resolve Hub URL from `window.location.origin` (`src/sync/client.ts`, `src/ui/main.ts`, `src/ui/state.ts`)
- Problem today: `src/ui/main.ts:18` always initializes `new WatchSyncClient(kernel.getStore(), DEFAULT_HUB_URL)` (`http://127.0.0.1:8000`), which fails when the Watch is opened from a Tier-2 Hub LAN URL like `http://192.168.1.14:8000/watch/` or embedded inside `/showcase`!
- Fix:
  - Export a pure helper `resolveDefaultHubUrl(loc?: { protocol: string; origin: string; hostname?: string } | null, savedHubUrl?: string | null): string` in `src/sync/client.ts`:
    - Determine `autoOrigin`: if `loc` has `protocol === "http:" || protocol === "https:"` and a valid non-empty `origin` (not `"null"`), use `loc.origin.replace(/\/+$/, "")`; otherwise `DEFAULT_HUB_URL`.
    - If `savedHubUrl` is present and non-empty, use it UNLESS `savedHubUrl` points to loopback (`localhost`, `127.*`, `::1`) while `loc.hostname` is a non-loopback LAN IP (ignore stale loopback override!).
    - Otherwise return `autoOrigin`.
  - Use `resolveDefaultHubUrl(typeof window !== "undefined" ? window.location : null)` as the default inside `WatchSyncClient` constructor and `src/ui/main.ts`, and apply the same stale-loopback check in `WatchUiController` (`src/ui/state.ts:117-120`).

### 2. In-Place 1-Second Recording Timer Update (`src/ui/render.ts`)
- Problem today: `render.ts:265-268` runs `setInterval(() => { recordingSeconds += 1; render(); }, 1000)`, calling `root.replaceChildren()` every second! That destroys the DOM, steals focus from `textInput`, and jumps scroll back to top.
- Fix:
  - Give the voice SOS record button a dedicated label ref (or `data-role="sos-rec-btn"` element reference) and inside the 1-second `setInterval`, update ONLY `recBtn.textContent = ...` in-place — NEVER call full `render()` on timer ticks!
  - Still clear the timer cleanly on stop, error, tab switch, or unmount.

### 3. `?embed=1` Chromeless Bezel Mode for `/showcase` (`index.html`, `src/ui/main.ts`)
- Problem today: `index.html:18-39` renders dark page padding (`min-height: 100vh`) and a wide `box-shadow` around `.watch-bezel`, causing scrollbars or clipping when `/showcase` embeds `/watch/?embed=1` in a compact 360x360 iframe.
- Fix:
  - In `src/ui/main.ts` (during `bootstrap()`), check `new URLSearchParams(window.location.search).get("embed") === "1"`. If true, add `document.body.classList.add("embed-mode")`.
  - In `index.html` CSS, style `body.embed-mode` with `min-height: auto; background: transparent; overflow: hidden;` and `.embed-mode .watch-bezel { box-shadow: none; margin: 0; }` so `/showcase` gets a crisp chromeless 360x360 circular watch face.

### 4. Dual-Mode `⇄` Cue & Non-Empty Text SOS Guard (`src/ui/render.ts`, `src/ui/state.ts`, `src/i18n/{en,hi}.ts`)
- Add a clear `⇄` toggle visual cue on `#mode-toggle` (e.g. `CHW ⇄` / `Family ⇄`, Hindi `स्वास्थ्य कर्मी ⇄` / `परिवार ⇄`) plus `aria-label` explaining it switches between CHW and Family modes.
- Fix `render.ts:288-294` (`sendTextBtn`): prevent sending an empty/whitespace-only Text SOS! When `textInput.value.trim().length === 0`, do NOT call `controller.submitSos(...)`; instead display a concise inline validation hint (`sos.textRequired`, e.g. `"Type an emergency note first."` / pure *Shuddh Tatsama* Hindi `"कृपया पहले आपातकालीन संदेश लिखें।"`). Clear the hint as soon as the user types or submits successfully.

### 5. Citizen-Friendly `PATIENT_FAMILY` Labels (`src/i18n/en.ts`, `src/i18n/hi.ts`, `src/ui/render.ts`)
- Problem today: `en.ts:75` shows `"Tier-2 Hub URL"` and `en.ts:82` shows `"TIER_0_WATCH · {count} queued"` — engineering jargon that confuses rural patients/families in `PATIENT_FAMILY` mode!
- Fix:
  - Replace `"Tier-2 Hub URL"` (`sync.hubLabel`) with `"Health Centre Address"` (Hindi already `"स्वास्थ्य केन्द्र संकेत"` or `"प्राथमिक स्वास्थ्य केन्द्र पता"` — verify pure *Shuddh Tatsama*!).
  - Replace `"TIER_0_WATCH · {count} queued"` (`sync.footer`) with citizen-friendly `"Watch · {count} pending"` (and keep Hindi `"संगी उपकरण · {count} प्रतीक्षित"`).
  - Verify `tests/ui/i18n.test.ts` passes with zero deny-listed/nukta words and exact key parity!

### 6. Touch-Safe Circular Chord Padding & Danger-Sign Confirm Guard (`index.html`, `src/ui/render.ts`, `src/ui/state.ts`)
- Circular geometry polish (`index.html`):
  - Add subtle top/bottom horizontal chord padding inside `.watch-pane` (`padding: 4px 14px 12px;`) and rounded-chord margin on `.watch-footer` so buttons at the top/bottom of the scrollable 360px circle never clip against the curved bezel border.
- Accidental-tap guard (`render.ts`, `state.ts`):
  - Tapping a `.sign-btn` in `CHW_COMPANION` Danger view highlights/arms that sign (`pendingConfirmFlag` in `WatchUiController`) showing a compact inline **"Confirm RED Emergency?"** (`danger.confirmBtn` + `danger.cancelBtn`) bar right inside the bezel before firing `controller.triggerDangerScreen([flag])`. This prevents accidental thumb taps on a curved watch face from appending irreversible `RED_EMERGENCY` CRDT events while keeping true emergency confirmation to 2 fast taps!
````

---

## Step-by-Step Checklist

1. Implement `resolveDefaultHubUrl` in `src/sync/client.ts` and wire it in `WatchSyncClient`, `src/ui/main.ts`, and `src/ui/state.ts`.
2. Update `src/ui/render.ts` for: in-place 1s timer update (no `root.replaceChildren()`), `⇄` cue on `#mode-toggle`, non-empty Text SOS validation guard, and 2-tap danger-sign confirm guard (`pendingConfirmFlag` in `state.ts`).
3. Update `index.html` and `src/ui/main.ts` for `?embed=1` chromeless bezel mode and touch-safe circular chord padding.
4. Update `src/i18n/{en,hi}.ts` with citizen-friendly labels (`sync.hubLabel`, `sync.footer`) and confirm/text-SOS keys (pure *Shuddh Tatsama* Hindi, zero nukta).
5. Add Vitest tests in `tests/sync/` (testing `resolveDefaultHubUrl` across LAN, loopback, stale override, and non-HTTP) and `tests/ui/` (testing non-empty Text SOS guard, confirm guard, and `i18n.test.ts`).

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
- Watch served from `http://<LAN-IP>:8000/watch/` automatically syncs to `http://<LAN-IP>:8000` without manual URL entry.
- Voice SOS 1s timer updates in-place without calling `root.replaceChildren()` or stealing focus.
- `?embed=1` renders a clean chromeless 360x360 bezel for `/showcase`; circular chord padding prevents clipped controls.
- Empty Text SOS is blocked cleanly; danger signs have a crisp 2-tap confirm guard; `PATIENT_FAMILY` displays zero engineering jargon (`TIER_0_WATCH` / `Tier-2 Hub URL`).
- `npm run typecheck`, `npm test`, `npm run build` (`dist/watch.js`), and `make verify` all pass.
