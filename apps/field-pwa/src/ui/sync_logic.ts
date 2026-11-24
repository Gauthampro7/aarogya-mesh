import type { ActionCard, PatientRecord } from "../../../../packages/contracts/ts/index";

const PRIO = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 } as const;

/** Cards for this phone, open first, then by priority. */
export function sortCards(cards: ActionCard[]): ActionCard[] {
  const open = (c: ActionCard) => (c.status === "OPEN" ? 0 : 1);
  return [...cards].sort((a, b) => open(a) - open(b) || PRIO[a.priority] - PRIO[b.priority] || a.card_id.localeCompare(b.card_id));
}

/** Local-first ack: minimal LWW status update, keyed by card_id (the projector merges it). */
export const ackPayload = (card: ActionCard) => ({ card_id: card.card_id, status: "ACKNOWLEDGED" as const });

/** Who a card is about: local name + village when known, else the raw id. */
export function cardPatientLabel(
  patientId: string | null,
  patients: ReadonlyMap<string, Pick<PatientRecord, "full_name" | "village_id">>,
): { name: string; village: string | null } | null {
  if (patientId === null) return null;
  const p = patients.get(patientId);
  return p ? { name: p.full_name, village: p.village_id } : { name: patientId, village: null };
}

/**
 * Wire each source to `set`; the first update that arrives while `isAlive()` is false
 * unsubscribes every source and writes nothing. Returns the unsubscribe-all function.
 */
export function bindLiveCount(
  sources: ReadonlyArray<(listener: (n: number) => void) => () => void>,
  isAlive: () => boolean,
  set: (n: number) => void,
): () => void {
  const offs: Array<() => void> = [];
  const off = () => offs.splice(0).forEach((f) => f());
  const listener = (n: number) => (isAlive() ? set(n) : off());
  for (const s of sources) offs.push(s(listener));
  return off;
}
