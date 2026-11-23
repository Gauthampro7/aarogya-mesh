# Track 3 · Slice 03 — Watch 1-Tap Rapid Triage & Reminder Engine

| Field | Value |
| :--- | :--- |
| **Task ID** | `T3-03` |
| **Track & Owner** | Track 3 (`apps/watch-companion`) · `@aril-travass` |
| **Issue / Branch** | Issue `#8` · `feat/watch-rapid-triage-reminders` |
| **Allowed Paths** | `apps/watch-companion/src/clinical/`, `apps/watch-companion/src/watch_kernel.ts`, `apps/watch-companion/tests/clinical/` |
| **Forbidden Paths** | `packages/`, `services/`, `apps/field-pwa/`, root `pyproject.toml`, `.github/` |
| **Depends On** | `T3-01` (`01-watch-core-store-hlc.md`) (can run in parallel with `T3-02`!) |

---

## Copy-Paste Starter Prompt

````text
You are working on Aarogya Mesh (`apps/watch-companion/`, Track 3) for Issue #8, Slice 3 of 4.

GOAL:
Build deterministic, zero-network clinical screening and reminder logic under `apps/watch-companion/src/clinical/`:
1. `src/clinical/rapid_triage.ts`:
   - 1-tap deterministic WHO IMNCI + maternal danger-sign screener (`evaluateWatchDangerScreen`) supporting pediatric danger signs (`not_able_to_drink_or_breastfeed`, `vomits_everything`, `convulsions`, `lethargic_or_unconscious`, `severe_respiratory_distress`) and maternal emergency signs (`vaginal_bleeding`, `severe_headache_or_blurred_vision`, `convulsions_or_fits`).
   - CLINICAL SAFETY FLOOR: Any single checked danger sign MUST deterministically force `severity: "RED_EMERGENCY"`, `referral_required: true`, `confidence: 1.0`, `execution_target: "LOCAL_DETERMINISTIC"`.
   - Emits a strict `TriageAssessment`-conformant `TRIAGE_COMPLETED` `CrdtEvent` payload matching `packages/contracts/ts/index.ts` (exact keys: `assessment_id`, `patient_id`, `severity`, `matched_rules`, `immediate_actions`, `referral_required`, `rationale`, `confidence`, `protocol_source`, `execution_target`, `assessed_at_ms` — NO extra keys like `watch_mode` because Hub Pydantic uses `extra="forbid"`!).
   - When `RED_EMERGENCY`, also emits a companion `ACTION_CARD_ISSUED` event (`priority: "CRITICAL"`, `target_tier: "TIER_0_WATCH"`) so emergency 108 referral guidance appears immediately on-watch.
2. `src/clinical/reminders.ts`:
   - Deterministic `PATIENT_FAMILY` reminder projector turning synced `VaccinationDueItem` / medication `ActionCard` items into glanceable due/overdue alerts (`OVERDUE` -> `HIGH`, `DUE_SOON` -> `MEDIUM`, `COMPLETED` hidden) plus pure *Shuddh Tatsama* Hindi & English alert copy (zero Perso-Arabic/Hinglish/nukta).
3. Unit tests in `apps/watch-companion/tests/clinical/rapid_triage.test.ts` verifying every single danger sign triggers `RED_EMERGENCY` + `referral_required: true`, strict payload key conformance (no forbidden extra keys), and reminder sorting/filtering.

CONSTRAINTS:
- Import types from `../../../../packages/contracts/ts/index`.
- ONLY touch Allowed Paths under `apps/watch-companion/`. No DOM/UI code in `src/clinical/`.
- Pure *Shuddh Tatsama* Hindi only (e.g., आपातकाल, चिकित्सालय, रोगी वाहन 108, टीकाकरण, श्वास कष्ट, ज्वर).
````

---

## Step-by-Step Checklist

1. Create `apps/watch-companion/src/clinical/rapid_triage.ts` implementing deterministic danger-sign evaluation with exact `TriageAssessment` payload schema compliance.
2. Create `apps/watch-companion/src/clinical/reminders.ts` projecting overdue/due-soon vaccinations and open `PATIENT_FAMILY` medication `ActionCard`s into compact watch reminder items.
3. Wire `WatchKernel.screenDangerSigns()` in `apps/watch-companion/src/watch_kernel.ts` to use `evaluateWatchDangerScreen` and persist emitted events into `WatchStore`.
4. Add `apps/watch-companion/tests/clinical/rapid_triage.test.ts` asserting red-flag monotonicity, exact allowed keys on `TRIAGE_COMPLETED` payloads (matching Hub `extra="forbid"`), and reminder priority ordering.

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
- Every single IMNCI/maternal danger sign deterministically outputs `RED_EMERGENCY` + `referral_required: true` with zero network calls.
- Emitted `TRIAGE_COMPLETED` payloads contain ONLY valid `TriageAssessment` keys (verified by test assertion against Hub `extra="forbid"` contract).
- `npm run typecheck`, `npm test`, and root `make verify` all pass.
