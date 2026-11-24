# Track 2 · Slice 05 — Voice Recorder Polish, Sync Stability & Hindi Triage Results

| Field | Value |
| :--- | :--- |
| **Task ID** | `T2-05` |
| **Track & Owner** | Track 2 (`apps/field-pwa`) · Srivastava (`@Akarshx-x`) |
| **Difficulty / Priority** | Normal · Hackathon Demo & Field Polish Sprint |
| **Branch** | `feat/field-pwa-voice-sync-polish` |
| **Allowed Paths** | `apps/field-pwa/src/ui/screens/voice.ts`, `apps/field-pwa/src/ui/screens/sync.ts`, `apps/field-pwa/src/ui/screens/triage_result.ts`, `apps/field-pwa/src/ui/voice_logic.ts`, `apps/field-pwa/src/ui/sync_logic.ts`, `apps/field-pwa/src/ui/main.ts`, `apps/field-pwa/src/ui/app.css`, `apps/field-pwa/src/i18n/en.ts`, `apps/field-pwa/src/i18n/hi.ts`, `apps/field-pwa/tests/ui/` |
| **Forbidden Paths** | `packages/`, `services/`, `apps/watch-companion/`, `apps/android-app/`, `apps/field-pwa/src/clinical/rules/*`, `apps/field-pwa/src/core/*`, `apps/field-pwa/src/sync/*`, root `pyproject.toml`, `.github/` |
| **Depends On** | `T2-02` (voice blob sync merged on `main`); independent of `T2-04` (minimal overlap only in `i18n/{en,hi}.ts`) |

---

## Copy-Paste Starter Prompt

````text
You are working on Aarogya Mesh (`apps/field-pwa/`, Track 2) for Task `T2-05`.
Read `AGENTS.md` and inspect `src/ui/screens/{voice,sync,triage_result}.ts`, `src/ui/main.ts`, `src/ui/settings.ts`, and `src/i18n/{en,hi}.ts` BEFORE editing.

CRITICAL INVARIANTS (NEVER VIOLATE):
1. Autonomy Invariant: Voice recording, local IndexedDB audio persistence (`putAudio` in `src/ui/audio_store.ts`), triage result rendering, and offline Action Card acks NEVER require a live Hub connection.
2. Clinical Safety Floor: NEVER edit `apps/field-pwa/src/clinical/rules/*` or alter `TriageAssessment` severity logic. Localization of `immediate_actions` / `rationale` in `triage_result.ts` is strictly display-layer translation while preserving exact deterministic English strings inside the stored `TRIAGE_COMPLETED` `CrdtEvent`.
3. Pure Indigenous Indic Vocabulary (`ARCHITECTURE.md` Section 4): EVERY new string in `src/i18n/hi.ts` MUST be pure *Shuddh Tatsama* Devanagari with ZERO Perso-Arabic loanwords, ZERO Hinglish transliterations, and ZERO nukta characters (U+093C: ख़ ग़ ज़ फ़ ड़ ढ़ क़), passing `tests/ui/i18n.test.ts`.
4. Zero `innerHTML` / zero external CDNs: construct DOM solely with `h(...)`.
5. Strict Path Isolation: ONLY edit files listed in Allowed Paths under `apps/field-pwa/`. Do NOT touch `packages/`, `services/`, `apps/watch-companion/`, `apps/android-app/`, or `src/clinical/rules/*`.

OBJECTIVES — IMPLEMENT ALL 3 POLISH AREAS:

### 1. Voice Recorder UX & Memory Safety (`src/ui/screens/voice.ts`, `src/ui/voice_logic.ts`)
- Problems today:
  - `voice.ts:36` calls `URL.createObjectURL(blob)` without ever revoking prior object URLs on re-record, discard, save, or route change.
  - No live `MM:SS` recording timer while `MediaRecorder` is active.
  - No **Discard / Re-record** action to clear a bad recording before saving.
  - When opened over plain HTTP on a LAN IP (e.g. `http://192.168.1.14:8000/phone/`), `window.isSecureContext` is `false` so `navigator.mediaDevices` is `undefined`, and `voice.ts:86` shows the misleading generic `voice.unsupported` message instead of clearly explaining that browser audio recording requires HTTPS / localhost or the Android APK (while typed notes still work offline!).
- Fix:
  - Add pure helper `formatDurationMmSs(ms: number): string` (e.g. `0 -> "00:00"`, `65_000 -> "01:05"`) and `recordingUnavailableReason(): "insecure_context" | "unsupported" | null` in `src/ui/voice_logic.ts` (checking `typeof isSecureContext === "boolean" && !isSecureContext` before `canRecordAudio()`).
  - In `voice.ts`:
    - Maintain `let previewUrl: string | null = null` and helper `revokePreview()` that calls `URL.revokeObjectURL(previewUrl)` and resets `player.removeAttribute("src")` whenever starting a new recording, discarding, saving, or when `rec` stops.
    - While recording, run a `setInterval(..., 500)` updating a dedicated timer span (in-place `textContent = formatDurationMmSs(Date.now() - startedAt)` — never re-rendering the form!) and clear the interval cleanly on stop/error/unmount (`pagehide` / `hashchange` cleanup).
    - Render a **Discard** button (`voice.discard`) next to the audio player once a clip is recorded; clicking it revokes the preview URL, clears `blob = null` and `durationMs = 0`, and hides the player.
    - If `recordingUnavailableReason() === "insecure_context"`, render a dedicated localized message (`voice.insecureContext`) explaining HTTPS / localhost / Android APK is needed for microphone capture and prompting the CHW to use the typed note field below.

### 2. Sync Screen Stability, Clean Hub Hint & Patient Names on Action Cards (`src/ui/screens/sync.ts`, `src/ui/sync_logic.ts`, `src/ui/main.ts`)
- Problems today:
  - `main.ts:60-66` listens to `engine.events.on("status", live)` and calls `debounced(() => void go(), 250)` whenever `current === "sync"`. Every time the CHW clicks **"Sync with PHC Hub"** (`sync.ts:36-42`), `engine.syncNow()` emits `"status"` (`"syncing"`, `"idle"`, `"offline"`), which triggers `go()` 250ms later, remounting `syncPanel()` and **wiping `msg`** (e.g. `sync.running`, `sync.badUrl`, or completion feedback)!
  - `sync.ts:65-66` displays BOTH `t("sync.hubHint")` (`"Example: http://127.0.0.1:8000"`) AND `t("sync.hubAuto", { u: auto })` (`"Using this health centre: http://192.168.1.14:8000"`), giving conflicting instructions when served from the Hub!
  - `sync.ts:44-59` renders Action Cards without showing the patient's name (only `c.title` / `c.summary`), even when `c.patient_id` matches a patient in `ctx.store.listPatients()`.
- Fix:
  - In `main.ts`: prevent background `"status"` ticks from wiping active user feedback on `sync` — only auto-refresh `"sync"` on `"cards"` or `"enrichment"` events (or skip rerender when `engine.status === "syncing"` / when an explicit sync status message is visible), so `sync.ts` controls its own post-sync refresh cleanly after `await runSync(ctx.engine)`!
  - In `sync.ts`:
    - When `auto` (`getAutoHubOrigin()`) is non-null, pass `t("sync.hubAuto", { u: auto })` as the single field hint on `field(t("sync.hubUrl"), url, ...)` and do NOT render the conflicting `http://127.0.0.1:8000` `sync.hubHint` below it. Only show `sync.hubHint` when `auto === null`.
    - Fetch `patients = await ctx.store.listPatients()` alongside `pending` and `cards`, build a `Map<string, PatientRecord>`, and display a crisp patient chip (`patient.full_name` + `village_id`, or fallback `c.patient_id` if unknown) on every Action Card with a non-null `patient_id`.

### 3. Hindi Triage Result Localization & Native Emergency Haptics (`src/ui/screens/triage_result.ts`, `src/i18n/{en,hi}.ts`)
- Problem today:
  - `triage_result.ts:23-24` renders `a.immediate_actions` and `a.rationale` directly in English even when `getLang() === "hi"`.
  - On Android APK (`apps/android-app`), `window.AarogyaNativeBridge?.vibrateEmergency()` is available for tactile RED emergency feedback, but `triage_result.ts` does not invoke it.
- Fix:
  - Add a pure display-translation helper (e.g. `localizeTriageAction(text: string): string` and `localizeTriageRationale(text: string, matchedRules: readonly string[]): string`) used when `getLang() === "hi"`:
    - Map canonical WHO IMNCI / Maternal ANC `immediate_actions` strings and rule-ID rationales (`IMNCI_GDS_*`, `MAT_RED_*`, `MAT_YEL_*`, pneumonia/diarrhea/fever/malnutrition/anemia/green home care) to crisp pure *Shuddh Tatsama* Hindi in `src/i18n/hi.ts` (falling back safely to the original string if an unknown custom string appears).
  - Inside `renderTriageResult(a)`: when `a.severity === "RED_EMERGENCY"`, safely call `try { (globalThis as { AarogyaNativeBridge?: { vibrateEmergency?: () => void } }).AarogyaNativeBridge?.vibrateEmergency?.(); } catch { /* ignore */ }` (zero crash in browser or Vitest).
````

---

## Step-by-Step Checklist

1. Add `formatDurationMmSs` and `recordingUnavailableReason` to `src/ui/voice_logic.ts`, then update `src/ui/screens/voice.ts` with live `MM:SS` timer, Discard button, `URL.revokeObjectURL`, and `!isSecureContext` guidance.
2. Fix `src/ui/main.ts` so 250ms `"status"` ticks do not wipe `sync.ts` status banners; update `src/ui/screens/sync.ts` to unify `hubAuto`/`hubHint` and resolve `patient_id -> full_name` on Action Cards.
3. Add pure *Shuddh Tatsama* Hindi localization helpers for triage actions/rationales in `src/i18n/{en,hi}.ts` and wire them + safe `AarogyaNativeBridge?.vibrateEmergency()` in `src/ui/screens/triage_result.ts`.
4. Add Vitest unit tests under `apps/field-pwa/tests/ui/` covering `formatDurationMmSs`, `recordingUnavailableReason`, patient-name resolution on cards, Hindi triage action/rationale localization, `AarogyaNativeBridge` optional call safety, and `tests/ui/i18n.test.ts`.
5. Run typecheck, full test suite, production build, and root `make verify`.

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
- Voice screen displays a live `MM:SS` recording timer, supports Discard/Re-record with `URL.revokeObjectURL`, and shows a clear HTTPS/APK message when `!isSecureContext`.
- Sync screen keeps status banners visible during/after sync, shows non-conflicting Hub origin hints, and displays patient full names on Action Cards.
- Triage Result renders pure *Shuddh Tatsama* Hindi immediate actions & rationale in Hindi mode and safely triggers `AarogyaNativeBridge?.vibrateEmergency?.()` on `RED_EMERGENCY`.
- `npm run typecheck`, `npm test` (including `tests/ui/i18n.test.ts` & `tests/clinical/rules_parity.test.ts`), `npm run build`, and `make verify` all pass.
