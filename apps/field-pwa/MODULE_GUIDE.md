# `apps/field-pwa` — Module Guide (Teammate A)

**Track**: Tier-1 CHW Offline Phone PWA  
**Owned Path**: `apps/field-pwa/` (do NOT edit `packages/` or `services/`)

---

## 1. Contract Lock & Core Invariants

1. **TypeScript Contracts**: Import all shared types from `../../packages/contracts/ts/index.ts` (`CrdtEvent`, `SyncEnvelope`, `PatientRecord`, `TriageAssessment`, `ActionCard`, `HardwareCapabilityManifest`).
2. **Zero RPC Coupling**: Every patient registration, WHO IMNCI danger-sign triage, UIP vaccination checklist, and voice-note recording MUST succeed in **Airplane Mode** with local persistence (IndexedDB) before any Hub sync occurs.
3. **Pure Indigenous Indic Vocabulary**: Any Hindi/regional UI strings MUST use *Shuddh Tatsama* / classical Dravidian clinical vocabulary (zero Perso-Arabic loanwords or Hinglish).

---

## 2. Quickstart

```bash
cd apps/field-pwa
npm run dev       # serves static PWA shell on http://127.0.0.1:5173
```

If you install dev tooling (`npm install` inside `apps/field-pwa`):

```bash
npm run typecheck # runs tsc --noEmit against packages/contracts/ts/index.ts
```

---

## 3. What to Build Next

1. **IndexedDB Event Log**: Persist `FieldSyncClient.pendingEvents` and materialized `patients` / `actionCards` in IndexedDB (`idb`) so reloads in Airplane Mode keep all state.
2. **Offline Clinical Forms**:
   - Patient registration (`PATIENT_REGISTERED`)
   - WHO IMNCI & maternal danger-sign screening (`TRIAGE_COMPLETED`) — port the JSON rule tables from `packages/clinical-engine/rules/` directly into the PWA so triage runs 100% locally on the phone.
   - India UIP immunization schedule tracker (`VACCINATION_LOGGED`)
   - Offline voice memo recorder (`VOICE_NOTE_RECORDED` with `enrichment_state: "PENDING"`)
3. **Hub Delta Sync**: Connect `FieldSyncClient.syncWithHub()` to the running Tier-2 Hub (`make run-hub`) at `POST /api/v1/sync` and `WS /ws/mesh` to receive `ENRICHMENT_COMPLETED` and `ACTION_CARD_ISSUED` cards back on the phone.
