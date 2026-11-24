# T1-05 — Tier-2 PHC Command Center (`/`) UI Quick-Wins & Polish

- **Task ID**: `T1-05`
- **Track & Owner**: Track 1 — `services/phc-hub/` UI Polish (**Krishna / Tiwari `@Krishnanand-10`**)
- **Difficulty**: Easy / Self-Contained Static Frontend Slice (zero Python changes)
- **Branch**: `feat/phc-hub-command-center-quickwins`
- **Allowed Paths**:
  - `services/phc-hub/src/aarogya_phc_hub/static/index.html`
  - `services/phc-hub/src/aarogya_phc_hub/static/app.css`
  - `services/phc-hub/src/aarogya_phc_hub/static/app.js`
- **Forbidden Paths**:
  - ALL `*.py` files (`app.py`, `dashboard.py`, `demo_scenarios.py`, `enrichment_worker.py`, `discovery.py`, tests)
  - `services/phc-hub/src/aarogya_phc_hub/static/showcase.{html,css,js}` (owned by `T1-04`)
  - `packages/`, `apps/`, `services/ml-pipeline/`, root `pyproject.toml`
- **Depends On**: `T1-03` (already merged on `main`)

---

## Copy-Paste Starter Prompt

```text
You are working on Aarogya Mesh (`/home/gautham/Personal/Gautham/Hackathon/1/aarogya-mesh`), Task T1-05.
First read `AGENTS.md` and then read these exact 3 files in full:
- `services/phc-hub/src/aarogya_phc_hub/static/index.html`
- `services/phc-hub/src/aarogya_phc_hub/static/app.css`
- `services/phc-hub/src/aarogya_phc_hub/static/app.js`

Goal: Polish the Tier-2 PHC Command Center (`/`) with 6 self-contained UX improvements while keeping the page 100% offline, XSS-safe, and compatible with all existing Hub endpoints and tests.

CRITICAL INVARIANTS (violating any of these fails CI or review):
1. ALLOWED PATHS ONLY: Edit ONLY `services/phc-hub/src/aarogya_phc_hub/static/{index.html,app.css,app.js}`. Do NOT touch any `.py` file, `showcase.*`, `packages/`, `apps/`, or `services/ml-pipeline/`.
2. ZERO `innerHTML`: NEVER use `innerHTML`, `outerHTML`, or `insertAdjacentHTML`. Build every DOM element strictly via the existing `el(tag, attrs, ...children)`, `setText(...)`, `textContent`, and `replaceChildren(...)` helpers.
3. ZERO EXTERNAL CDNs: Do NOT add any `http://` or `https://` `<script>`, `<link>`, font, or image URLs (`test_dashboard.py` fails if external URLs appear).
4. PRESERVE EXISTING IDs & SELECTORS: Keep all existing element IDs (`app-title`, `badge-tier`, `btn-lang`, `btn-theme`, `btn-autorefresh`, `btn-refresh`, `btn-run-enrichment`, `demo-status-banner`, `outbreak-banner`, `kpi-patients`, `kpi-red`, `kpi-yellow`, `kpi-green`, `kpi-pending`, `kpi-completed`, `kpi-events`, `triage-list`, `action-cards-list`, `shap-list`, `outbreak-list`, `patients-list`, `peers-list`, `events-tbody`, `event-type-filter`, `btn-toggle-events`, `events-collapsible`, `event-log-count`) intact.
5. PURE SHUDDH TATSAMA HINDI: Every new `I18N.hi` string MUST use pure Sanskrit-derived Tatsama Hindi with ZERO Perso-Arabic/Urdu loanwords, ZERO Hinglish transliterations, and ZERO Unicode nukta (`\u093c` / `़`).

Exact 6 Changes to Implement:
1. `patient_id → full_name` Resolution (`app.js`):
   - Add a helper `buildPatientNameMap(patients)` mapping `patient_id -> full_name` from `state.lastSummary?.patients` and `formatPatientLabel(patientId, nameMap)` returning `"Full Name (patient_id)"` when known, or `patientId` fallback when unknown.
   - Apply this in `renderTriageHistory(...)`, `renderShap(...)`, `renderActionCards(...)`, and `renderEvents(...)` (show full name prominently and keep `patient_id` as secondary mono/title text so clinicians immediately recognize patients instead of raw IDs).
2. `"+N more"` Truncation Indicators (`app.js` + `app.css`):
   - `renderPatients` slices at 8, `renderTriageHistory` slices at 6, and `renderShap` slices at 6.
   - Whenever `list.length > limit`, append a subtle `.more-counter` pill/note (`"+N more"` in English, `"+N अतिरिक्त"` in Hindi) below the rendered cards so operators know records are truncated rather than missing.
3. Auto-Expand CRDT Event Log on Filter Change (`app.js`):
   - In `bindEvents()` inside the `#event-type-filter` `change` handler: when the user selects any filter value (or changes filter) while `!state.eventsExpanded`, automatically set `state.eventsExpanded = true`, remove `hidden` from `#events-collapsible`, set `aria-expanded="true"` on `#btn-toggle-events`, and update button text to `t("hideEventLog")` before calling `refreshAll()`.
4. Active Scenario Narrative Card from `GET /api/v1/demo/scenarios` (`index.html`, `app.js`, `app.css`):
   - On boot (`DOMContentLoaded`), fetch `/api/v1/demo/scenarios` (via `fetchJsonSafe`) and cache the catalog by `id` in `state.scenarioCatalog` (each entry has `{ id, title, subtitle, persona, steps: string[] }`).
   - When a scenario is loaded via `runScenario(scenarioId)`, render a compact, dismissible `#scenario-narrative-card` right beneath `#demo-status-banner` showing the active scenario's `title`, `persona` badge, `subtitle`, and ordered `steps` list (using `el(...)` only!). Hide/clear the narrative card when `resetDemo()` succeeds or when the user clicks its close button.
5. Persist `lang` and `theme` in `localStorage` (`app.js`):
   - Use keys `aarogya.lang` (`"en"` | `"hi"`) and `aarogya.theme` (`"dark"` | `"light"`) — matching `/showcase` so theme and language stay consistent across pages!
   - Guard every `localStorage.getItem` / `localStorage.setItem` call with `try { ... } catch (_err) {}` so restricted contexts never throw.
   - Read stored values on boot before initial `applyTranslations()` and apply `document.documentElement.setAttribute("data-theme", state.theme)`.
6. Compact Header Spacing (`app.css`):
   - Tighten vertical padding/gaps on `.app-shell`, `.topbar`, `.demo-bar`, and `.arch-bar` (~15–20% tighter vertical footprint) so the KPI row and top of the clinical panels sit comfortably above the fold on 1280×720–1440×900 displays in both Dark and Light themes without wrapping controls awkwardly.

Edge Cases to Handle:
- `GET /api/v1/demo/scenarios` returns `null` or network error -> narrative card simply stays hidden; scenario buttons still work.
- `patient_id` is `null` (e.g., village-level `OUTBREAK_ALERT_RAISED`) -> render `"--"` safely.
- Switching EN ↔ हिन्दी updates `"+N more"` / `"+N अतिरिक्त"`, narrative card labels, and persisted `aarogya.lang`.
- Keep total diff crisp (<300 LOC). Run verification commands before finishing.
```

---

## Step-by-Step Checklist

1. Add `aarogya.lang` and `aarogya.theme` `localStorage` load/save helpers in `app.js` (with `try/catch` guards) and initialize `data-theme` on boot.
2. Add `buildPatientNameMap()` and wire `full_name` display across `renderTriageHistory`, `renderShap`, `renderActionCards`, and `renderEvents`.
3. Add `"+N more"` / `"+N अतिरिक्त"` truncation pills in `renderPatients` (>8), `renderTriageHistory` (>6), and `renderShap` (>6) with clean styling in `app.css`.
4. Update `#event-type-filter` change listener to auto-expand `#events-collapsible` and sync `#btn-toggle-events` `aria-expanded` + label.
5. Fetch `/api/v1/demo/scenarios` on boot and render the dismissible `#scenario-narrative-card` (`title`, `persona`, `subtitle`, `steps`) in `index.html`/`app.js`/`app.css` when `runScenario()` completes; clear it in `resetDemo()`.
6. Tighten `.app-shell`, `.topbar`, `.demo-bar`, and `.arch-bar` vertical spacing in `app.css` and verify no `innerHTML`, no external CDN URLs, and zero nukta in `I18N.hi`.

---

## Verification Commands & Definition of Done

```bash
# 1. Confirm only allowed files changed
git status -s

# 2. Guard against innerHTML, external CDNs, and Hindi nukta in static files
python3 -c "
from pathlib import Path
base = Path('services/phc-hub/src/aarogya_phc_hub/static')
for name in ('index.html', 'app.css', 'app.js'):
    text = (base / name).read_text(encoding='utf-8')
    assert 'innerHTML' not in text and 'insertAdjacentHTML' not in text, f'XSS sink in {name}'
    assert 'https://' not in text and 'http://' not in text, f'External URL in {name}'
    assert '\u093c' not in text, f'Nukta found in {name}'
print('Static hygiene guards passed!')
"

# 3. Verify JS syntax (requires Node)
node --check services/phc-hub/src/aarogya_phc_hub/static/app.js

# 4. Run dashboard tests and full repo gate
uv run pytest -v services/phc-hub/tests/test_dashboard.py
make verify
```

- [ ] `patient_id → full_name` displays cleanly on Triage, SHAP, Action Cards, and Event Log rows.
- [ ] `"+N more"` / `"+N अतिरिक्त"` pill appears whenever Patients (>8), Triage (>6), or SHAP (>6) lists are truncated.
- [ ] Selecting an event type in `#event-type-filter` automatically expands `#events-collapsible`.
- [ ] Active scenario narrative card renders `title`, `persona`, `subtitle`, and `steps` from `/api/v1/demo/scenarios` and clears on Reset.
- [ ] `aarogya.lang` and `aarogya.theme` persist across page reloads via `localStorage`.
- [ ] `node --check`, static hygiene guards, `test_dashboard.py`, and `make verify` all pass 100%.
