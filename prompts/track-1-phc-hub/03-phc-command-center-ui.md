# T1-03 — Tier-2 PHC Command Center Offline Web Dashboard

- **Task ID**: `T1-03`
- **Track & Owner**: Track 1 — `services/phc-hub/` (Core Bedrock / Gautham)
- **Branch**: `feat/phc-hub-command-center-ui`
- **Allowed Paths**:
  - `services/phc-hub/src/aarogya_phc_hub/app.py` (add `GET /`, `GET /api/v1/dashboard/summary`, `GET /api/v1/events`)
  - `services/phc-hub/src/aarogya_phc_hub/static/index.html` (new)
  - `services/phc-hub/src/aarogya_phc_hub/static/dashboard.js` (new)
  - `services/phc-hub/src/aarogya_phc_hub/static/dashboard.css` (new)
  - `services/phc-hub/tests/test_dashboard.py` (new)
- **Forbidden Paths**: `packages/contracts/`, `packages/clinical-engine/`, `packages/crdt-sync/`, `services/ml-pipeline/`, `apps/`, root `pyproject.toml`
- **Depends On**: `T1-01` (enrichment summaries/outbreak alerts) and `T1-02` (`GET /api/v1/peers`, `GET /api/v1/discovery/connect-info`)

---

## Copy-Paste Starter Prompt

```text
You are working on Aarogya Mesh (`/home/gautham/Personal/Gautham/Hackathon/1/aarogya-mesh`), Task T1-03.
First read `AGENTS.md`, `ARCHITECTURE.md`, and `services/phc-hub/src/aarogya_phc_hub/app.py`.

Goal: Build a 100% offline, zero-CDN Tier-2 PHC Command Center web dashboard served directly by `services/phc-hub` so medical officers and hackathon judges can inspect live mesh topology, hardware capability manifests, SHAP risk attributions, EWMA outbreak alerts, and the HLC-ordered CRDT event log.

Hard Constraints:
1. Only touch Allowed Paths: `services/phc-hub/src/aarogya_phc_hub/app.py`, `services/phc-hub/src/aarogya_phc_hub/static/{index.html,dashboard.js,dashboard.css}`, and `services/phc-hub/tests/test_dashboard.py`.
2. Zero External Assets: Do NOT load Google Fonts, CDN CSS/JS, or external QR APIs. Use crisp, high-contrast vanilla HTML/CSS/ES modules served via FastAPI `StaticFiles` / `FileResponse`.
3. Add two lightweight read-only Hub endpoints in `app.py`:
   - `GET /api/v1/events?event_type=&limit=100` -> recent `CrdtEvent` list ordered by HLC descending (for the CRDT Sync Log Inspector).
   - `GET /api/v1/dashboard/summary` -> aggregated view combining `manifest`, `health`, `peers`, projected `patients`/`action_cards`/`outbreak_alerts`, and extracted `risk_score`/`shap_attributions` from `ENRICHMENT_COMPLETED` events.
   - `GET /` -> serves `static/index.html` (and mount `/static` for `dashboard.js` + `dashboard.css`).
4. Dashboard Panels:
   - Hub Status & Capability Manifest card (tier, RAM, CPU cores, NPU, LAN/WS connect URL from `/api/v1/discovery/connect-info`, plus "Run Enrichment Now" button calling `POST /api/v1/enrichment/run-once`).
   - Live Mesh Peer Topology (Tier-0 Watch + Tier-1 Phone + Tier-2 Hub nodes with battery, watch_mode, last seen).
   - Clinical Priority Queue (RED/YELLOW patients, Action Cards, SHAP top feature attribution bars, EWMA Outbreak Alert banner).
   - CRDT Event Log Inspector (table of `hlc`, `origin_node_id`, `event_type`, `patient_id`, `enrichment_state` with `event_type` filter).
5. Pure Indigenous Indic Vocabulary: Include an `EN / हिन्दी` toggle using strictly *Shuddh Tatsama* Hindi (e.g. `प्राथमिक स्वास्थ्य केन्द्र`, `ज्वर`, `आपातकाल`, `टीकाकरण`, `संक्रमण चेतावनी`) with zero Perso-Arabic loanwords or Hinglish.
6. Keep diff concise (<300 LOC Python + clean modular static files). Run `make verify` before finishing.
```

---

## Step-by-Step Checklist

1. Add `GET /api/v1/events` (HLC-ordered with optional `event_type` and `limit` query params) and `GET /api/v1/dashboard/summary` to `services/phc-hub/src/aarogya_phc_hub/app.py`.
2. Serve `static/index.html` at `GET /` and static assets at `/static` using paths resolved relative to `Path(__file__).resolve().parent / "static"`.
3. Build `static/index.html`, `static/dashboard.css`, and `static/dashboard.js` with auto-refresh (5s polling + manual refresh), EN/हिन्दी (*Shuddh Tatsama*) toggle, SHAP attribution horizontal bars, outbreak alert banner, peer cards, and CRDT log filter.
4. Ensure all user/event strings rendered in `dashboard.js` use `textContent` / safe DOM builders (zero `innerHTML` XSS risk).
5. Write `services/phc-hub/tests/test_dashboard.py` verifying `GET /` returns `200 text/html` with zero `http://`/`https://` CDN links, `GET /api/v1/events` filters by `event_type`, and `GET /api/v1/dashboard/summary` surfaces projected patients, SHAP risk scores, and outbreak alerts.

---

## Verification Commands & Definition of Done

```bash
uv run pytest -v services/phc-hub/tests/test_dashboard.py services/phc-hub/tests/test_hub_api.py
make verify
```

- [ ] Visiting `http://127.0.0.1:8000/` in Airplane Mode renders the complete PHC Command Center with zero broken or external requests.
- [ ] `GET /api/v1/dashboard/summary` accurately reflects synced peers, patients, action cards, SHAP attributions, and EWMA outbreak alerts.
- [ ] `GET /api/v1/events` lists CRDT events ordered by HLC with working `event_type` filtering.
- [ ] Hindi toggle uses strictly *Shuddh Tatsama* terminology (zero Perso-Arabic/Hinglish).
- [ ] `make verify` passes (8/8 schemas, 0 ruff errors, all tests passing).
