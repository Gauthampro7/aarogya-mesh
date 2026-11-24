# Track 2 · Slice 04 — Patient Roster, Age/Pregnancy UX, Triage Scroll & Pre-Checked Checklists

| Field | Value |
| :--- | :--- |
| **Task ID** | `T2-04` |
| **Track & Owner** | Track 2 (`apps/field-pwa`) · Srivastava (`@Akarshx-x`) |
| **Difficulty / Priority** | Normal · Hackathon UX Polish Sprint |
| **Branch** | `feat/field-pwa-queue-form-ux` |
| **Allowed Paths** | `apps/field-pwa/src/ui/screens/home.ts`, `apps/field-pwa/src/ui/screens/register.ts`, `apps/field-pwa/src/ui/screens/triage.ts`, `apps/field-pwa/src/ui/screens/checklist.ts`, `apps/field-pwa/src/ui/register_logic.ts`, `apps/field-pwa/src/ui/triage_map.ts`, `apps/field-pwa/src/ui/checklist_logic.ts`, `apps/field-pwa/src/ui/app.css`, `apps/field-pwa/src/i18n/en.ts`, `apps/field-pwa/src/i18n/hi.ts`, `apps/field-pwa/tests/ui/` |
| **Forbidden Paths** | `packages/`, `services/`, `apps/watch-companion/`, `apps/android-app/`, `apps/field-pwa/src/clinical/rules/*`, `apps/field-pwa/src/core/*`, `apps/field-pwa/src/sync/*`, root `pyproject.toml`, `.github/` |
| **Depends On** | `T2-01`, `T2-02`, `T2-03` (all merged on `main`) |

---

## Copy-Paste Starter Prompt

````text
You are working on Aarogya Mesh (`apps/field-pwa/`, Track 2) for Task `T2-04`.
Read `AGENTS.md` and inspect every target file listed below BEFORE editing.

CRITICAL INVARIANTS (NEVER VIOLATE):
1. Autonomy Invariant: Every screen works 100% offline against local IndexedDB (`ctx.store` + `ctx.engine`). Zero synchronous Hub RPC calls.
2. Clinical Safety Floor: NEVER alter `apps/field-pwa/src/clinical/rules/*` (parity with `packages/clinical-engine/rules/*.json` is enforced by `tests/clinical/rules_parity.test.ts`). `evaluateTriage` / `evaluateWatchRapidTriage` remains the sole authority for `TriageSeverity`.
3. Pure Indigenous Indic Vocabulary (`ARCHITECTURE.md` Section 4): EVERY new key added to `src/i18n/en.ts` MUST have an exact matching key in `src/i18n/hi.ts` written in pure *Shuddh Tatsama* Devanagari with ZERO Perso-Arabic loanwords, ZERO Hinglish transliterations, and ZERO nukta characters (U+093C: ख़ ग़ ज़ फ़ ड़ ढ़ क़). Verified automatically by `tests/ui/i18n.test.ts`.
4. Zero `innerHTML` / zero external CDNs: build all DOM nodes using `h(...)` from `src/ui/dom.ts`.
5. Strict Path Isolation: ONLY edit files inside the Allowed Paths under `apps/field-pwa/`. Do NOT touch `packages/`, `services/`, `apps/watch-companion/`, `apps/android-app/`, or `apps/field-pwa/src/clinical/rules/*`.

OBJECTIVES — IMPLEMENT ALL 4 SELF-CONTAINED UX IMPROVEMENTS:

### 1. Full Projected Patient Roster + Search + Latest Severity Badges (`src/ui/screens/home.ts`, `src/ui/app.css`)
- Problem today: `home.ts:14-19` filters `patients` to `e.hlc.wall_ms >= dayStart`, so patients synced from Watch/Hub or registered on earlier days disappear from Home!
- Fix:
  - Keep a pure helper (e.g. in `home.ts` or a small pure helper tested by Vitest) that scans `events` (`event_type === "TRIAGE_COMPLETED"`) by `patient_id` using canonical HLC order `(wall_ms, logical, node_id)` to find each patient's **latest `TriageSeverity`** (`RED_EMERGENCY` | `YELLOW_PHC` | `GREEN_HOME` | `null`) and latest activity timestamp.
  - Render a compact **live search input** above the patient list filtering by `full_name`, `village_id`, or `household_id` (case-insensitive substring match) without re-fetching IndexedDB on every keystroke.
  - Display ALL projected/synced patients (sorted by most recently touched / registered, newest first — never dropping synced or previous-day patients!), showing:
    - `full_name`, village (`village_id`), human-friendly age (years + months when >= 24 months, or months when < 24 months), and a colour+text severity badge (`RED_EMERGENCY` / `YELLOW_PHC` / `GREEN_HOME`) when assessed.
  - Keep tapping any patient navigating directly to `#/triage/${encodeURIComponent(p.patient_id)}`.

### 2. Years / Months Age Toggle + Conditional Pregnancy Fields (`src/ui/screens/register.ts`, `src/ui/register_logic.ts`)
- Problem today:
  - `register.ts:25` only accepts `age_months` (`0..1500`), forcing ASHA workers to multiply adult ages by 12 mentally!
  - `register.ts:31,44` always renders the `is_pregnant` checkbox even when `sex` is `"M"`, `"O"`, or `"U"`, only showing an error after submit.
- Fix:
  - Add an `age_unit?: "months" | "years"` field (default `"months"` so existing `RegisterForm` callers/tests stay 100% backward-compatible!) in `src/ui/register_logic.ts`:
    - When `age_unit === "years"`, validate integer years in `0..125` and convert to `age_months = years * 12` (still capped at `1500` matching `PatientRecord`).
  - In `register.ts`, render a clean `Years / Months` toggle (segmented buttons or `<select>`) beside the age input, updating `max` (`125` vs `1500`) and helper hint dynamically.
  - Listen to `sex.addEventListener("change", ...)` (and run once on initial render): show the `preg` checkbox row ONLY when `sex.value === "F"`. Whenever `sex.value !== "F"`, hide BOTH `preg` and `weeksField`, uncheck `preg`'s checkbox, and clear `weeks.value = ""`.

### 3. Triage Scroll-to-Result, Maternal Flag Filter & Fast-Emergency Confirmation (`src/ui/screens/triage.ts`, `src/ui/triage_map.ts`)
- Problem today:
  - `triage.ts:184` focuses `#triage-result` but does not scroll it into view on small phone screens (`scrollIntoView`).
  - `triage_map.ts:73` and `triage.ts:158,164` display ALL `pediatricDangerOptions()` on `MATERNAL` and `GENERAL` forms — including `"stridor_in_calm_child"` (*"Stridor in a calm child"*), which is pediatric-only!
  - `triage.ts:215-221` fires `evaluateWatchRapidTriage(["lethargic_or_unconscious"], ...)` immediately on a single accidental tap of `fastBtn`, permanently appending a `RED_EMERGENCY` CRDT event with zero confirmation!
- Fix:
  - In `triage.ts` `show(a)`: after appending `renderTriageResult(a)`, call `resEl?.scrollIntoView({ behavior: "smooth", block: "start" })` in addition to `resEl?.focus()`.
  - In `triage_map.ts`: define `PEDIATRIC_ONLY_DANGER_FLAGS = new Set(["stridor_in_calm_child"])` and export `dangerOptionsForCategory(category: PatientCategory): FlagOption[]` (returning all `pediatricDangerOptions()` for `"PEDIATRIC"`, and filtering out `PEDIATRIC_ONLY_DANGER_FLAGS` for `"MATERNAL"` and `"GENERAL"`). Update `visibleFlags(category)` and `triage.ts` `drawForm()` to use `dangerOptionsForCategory(st.category)`. Keep `pediatricDangerOptions()` unchanged for backward compatibility with existing tests.
  - In `triage.ts`: replace the instant one-click `fastBtn` submission with a clean 2-step inline confirmation panel (no `window.confirm` browser popup — use accessible DOM elements inside the screen!): clicking `fastBtn` expands a compact red confirmation box letting the CHW select/confirm the observed danger sign (e.g. `lethargic_or_unconscious`, `convulsions`, `severe_breathing_difficulty`, `vaginal_bleeding` — localized via `tx("flag.<id>", ...)`) with explicit **"Confirm Emergency"** and **"Cancel"** buttons before calling `evaluateWatchRapidTriage(...)` and `show(...)`.

### 4. Pre-Check Saved Checklist Items + Live `done/total` Counter (`src/ui/screens/checklist.ts`, `src/ui/checklist_logic.ts`)
- Problem today: `checklist.ts:15-27` always calls `done.clear()` when switching patient or checklist type, never pre-checking items already recorded in prior `CHECKLIST_RECORDED` events, and only shows `ck.score` after clicking Save.
- Fix:
  - Add a pure helper `latestCompletedChecks(events: readonly CrdtEvent[], patientId: string | null, type: ChecklistType): Set<string>` in `src/ui/checklist_logic.ts`:
    - If `patientId` is non-null, find the latest `CHECKLIST_RECORDED` event (by HLC `(wall_ms, logical, node_id)`) matching `e.patient_id === patientId && e.payload.checklist_type === type` and return its `completed_items` string array as a `Set<string>`.
  - In `checklist.ts`: load `const events = await ctx.store.getAllEvents()` (and append newly saved `ev` locally to `events` on save), pre-populate `done` from `latestCompletedChecks(...)` whenever patient or checklist type changes, check the corresponding checkboxes, and display a live `done / total` progress counter (`t("ck.score", { done: done.size, total: items.length })`) that updates immediately on every checkbox toggle.

### 5. Pure Tests (`apps/field-pwa/tests/ui/`)
- Add/extend Vitest tests covering:
  - `register_logic`: `age_unit: "years"` conversion (`25` -> `300`, `126` -> error, `dob` still takes precedence).
  - `triage_map`: `visibleFlags("MATERNAL")` and `dangerOptionsForCategory("MATERNAL")` exclude `"stridor_in_calm_child"`, while `"PEDIATRIC"` includes it.
  - `checklist_logic`: `latestCompletedChecks(...)` returns the newest HLC event's `completed_items` for `(patient_id, checklist_type)` and empty set for anonymous/unrecorded patients.
  - `home` helper: full roster includes synced/previous-day patients, search filters by name/village, and latest severity badge tracks highest-HLC `TRIAGE_COMPLETED`.
  - `i18n.test.ts`: passes 100% with all new keys in `en.ts` and pure *Shuddh Tatsama* `hi.ts`.
````

---

## Step-by-Step Checklist

1. Add pure helpers & unit tests first in `register_logic.ts`, `triage_map.ts`, `checklist_logic.ts`, and a pure roster/search helper for `home.ts`.
2. Add all new UI strings to `src/i18n/en.ts` and pure *Shuddh Tatsama* Hindi equivalents to `src/i18n/hi.ts` (zero Perso-Arabic, Hinglish, or nukta U+093C).
3. Wire the 4 UI screens (`home.ts`, `register.ts`, `triage.ts`, `checklist.ts`) and compact badge/toggle styling in `app.css`.
4. Add/update Vitest suites under `apps/field-pwa/tests/ui/` covering all 4 improvements plus `i18n.test.ts`.
5. Run typecheck, unit tests, production bundle build (`dist/app.js` + stamped `sw.js`), and root `make verify`.

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
- Home displays ALL projected/synced patients (not just today's), with instant search and latest severity badges.
- Register supports `Years / Months` age toggle and hides/resets pregnancy fields when `sex !== "F"`.
- Triage scrolls smoothly to `#triage-result`, hides `"stridor_in_calm_child"` for non-pediatric categories, and requires explicit confirmation on the fast-emergency button.
- Checklist pre-checks previously saved items per `(patient_id, checklist_type)` and updates `done/total` live on every checkbox toggle.
- `npm run typecheck`, `npm test` (including `tests/ui/i18n.test.ts` & `tests/clinical/rules_parity.test.ts`), `npm run build`, and `make verify` all pass with zero errors.
