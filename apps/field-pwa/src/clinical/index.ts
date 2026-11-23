/** Offline deterministic clinical safety floor for the Tier-1 phone (ported from packages/clinical-engine). */

export {
  FLAG_ALIASES,
  evaluateTriage,
  evaluateWatchRapidTriage,
  normalizeFlag,
  triageToActionCard,
  validateTriageInput,
} from "./triage";
export type { PatientCategory, TriageInput, TriageMode } from "./triage";
export { IMNCI_PEDIATRIC_RULES } from "./rules/imnci_pediatric";
export { MATERNAL_ANC_RULES } from "./rules/maternal_anc";
