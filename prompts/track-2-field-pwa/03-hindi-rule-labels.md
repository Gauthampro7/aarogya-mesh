# Track 2 · Slice 03 — Pure Shuddh Tatsama Hindi Rule Labels

| Field | Value |
| :--- | :--- |
| **Task ID** | `T2-03` |
| **Track & Owner** | Track 2 (`apps/field-pwa`) · `@Akarshx-x` |
| **Issue / Branch** | Issue `#10` · `feat/field-pwa-hindi-rule-labels` |
| **Allowed Paths** | `apps/field-pwa/src/i18n/en.ts`, `apps/field-pwa/src/i18n/hi.ts`, `apps/field-pwa/src/ui/screens/triage.ts`, `apps/field-pwa/src/ui/screens/checklist.ts`, `apps/field-pwa/src/ui/triage_map.ts`, `apps/field-pwa/tests/ui/i18n.test.ts` |
| **Forbidden Paths** | `packages/`, `services/`, `apps/watch-companion/`, `apps/field-pwa/src/clinical/rules/` (keep canonical rule tables in sync with Python) |
| **Depends On** | None (independent — can run in parallel with `T2-01` and `T2-02`) |

---

## Copy-Paste Starter Prompt

````text
You are working on Aarogya Mesh (`apps/field-pwa/`, Track 2) for Issue #10.

CONTEXT:
- Currently `src/ui/screens/triage.ts` renders `o.label` directly from `pediatricDangerOptions()`, `maternalRedOptions()`, and `maternalYellowOptions()` (English strings from canonical rule tables), and `src/ui/screens/checklist.ts` renders `i.label` directly from `checklistItems(type)` — so when the CHW toggles the UI to Hindi (`hi`), those checkboxes remain in English.
- `src/i18n/index.ts` already exports `tx(key, fallback)` for data-driven translation lookups, and `tests/ui/i18n.test.ts` strictly enforces:
  1. Identical key sets between `en.ts` and `hi.ts`.
  2. Zero Perso-Arabic loanwords and zero Hinglish transliterations (`DENY` list).
  3. Zero nukta characters (`ख़ ग़ ज़ फ़ ड़ ढ़ क़` / U+093C) in any Unicode normalization form.
  4. Pure Devanagari in Hindi values (Latin allowed only for units `(°C)`, `(%)`, `(g/dL)`, `(cm)`, placeholders `{...}`, `108`).

GOAL:
1. Add i18n keys to both `apps/field-pwa/src/i18n/en.ts` and `apps/field-pwa/src/i18n/hi.ts` for EVERY:
   - Pediatric general danger sign (`flag.<flag_id>`) from `pediatricDangerOptions()`
   - Maternal red flag (`flag.<flag_id>`) from `maternalRedOptions()`
   - Maternal yellow flag (`flag.<flag_id>`) from `maternalYellowOptions()`
   - ANC/PNC checklist item (`cki.<item_id>`) across all 5 `checklistTypes()` (`anc_trimester_1..3`, `pnc_mother`, `pnc_newborn`)
2. Render localized labels via `tx(...)` in `src/ui/screens/triage.ts`, `src/ui/screens/checklist.ts`, and `flagLabel()` in `src/ui/triage_map.ts` (falling back safely to canonical English `label`).
3. Extend `apps/field-pwa/tests/ui/i18n.test.ts` to assert that 100% of `pediatricDangerOptions()`, `maternalRedOptions()`, `maternalYellowOptions()`, and `checklistItems(type)` for all 5 checklist types have matching keys in both `en` and `hi` (automatically vetted by the existing pure *Shuddh Tatsama* & zero-nukta assertions!).

CONSTRAINTS:
- ONLY touch Allowed Paths under `apps/field-pwa/`. Do NOT modify `src/clinical/rules/*` (they mirror `packages/clinical-engine/rules/*.json` byte-for-byte).
- Strictly follow `ARCHITECTURE.md` Section 4: use pure *Shuddh Tatsama* Sanskrit-derived clinical Hindi (e.g., ज्वर, श्वास कष्ट, रक्तस्राव, आक्षेप, मूर्छा, प्रसवपूर्व, नवजात शिशु, चिकित्सालय, टीकाकरण — NEVER बुख़ार, खून, दौरा/खतरा, अस्पताल, दवा, चेकलिस्ट).
````

---

## Step-by-Step Checklist

1. Inspect every `flag` ID in `IMNCI_PEDIATRIC_RULES.general_danger_signs`, `MATERNAL_ANC_RULES.red_flag_symptoms`, `MATERNAL_ANC_RULES.yellow_flag_symptoms`, and every checklist `item.id` in `MATERNAL_ANC_RULES.checklists`.
2. Add matching `flag.<id>` and `cki.<id>` keys to `apps/field-pwa/src/i18n/en.ts` and pure *Shuddh Tatsama* Devanagari translations to `apps/field-pwa/src/i18n/hi.ts` (zero nukta, zero Perso-Arabic/Hinglish).
3. Update `triage.ts` (`flagGroup` / `flagLabel`) and `checklist.ts` (`drawItems`) to resolve display text via `tx(\`flag.${o.flag}\`, o.label)` and `tx(\`cki.${i.id}\`, i.label)`.
4. Extend `apps/field-pwa/tests/ui/i18n.test.ts` to verify complete coverage of all pediatric danger signs, maternal red/yellow flags, and all 5 ANC/PNC checklists.
5. Run Vitest and build to confirm every pure-Hindi guard and UI test passes.

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
- Switching language to Hindi renders 100% Devanagari labels on Triage and Checklist screens with zero untranslated English rule checkboxes.
- `tests/ui/i18n.test.ts` asserts full coverage of all danger/maternal flags and all 5 checklists and passes with zero deny-list or nukta violations.
- `src/clinical/rules/` remains untouched so `tests/clinical/rules_parity.test.ts` stays green.
