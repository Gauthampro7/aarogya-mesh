import type { ActionCard } from "../../../../packages/contracts/ts/index";

const PRIO = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 } as const;

/** Cards for this phone, open first, then by priority. */
export function sortCards(cards: ActionCard[]): ActionCard[] {
  const open = (c: ActionCard) => (c.status === "OPEN" ? 0 : 1);
  return [...cards].sort((a, b) => open(a) - open(b) || PRIO[a.priority] - PRIO[b.priority] || a.card_id.localeCompare(b.card_id));
}

/** Local-first ack: minimal LWW status update, keyed by card_id (the projector merges it). */
export const ackPayload = (card: ActionCard) => ({ card_id: card.card_id, status: "ACKNOWLEDGED" as const });
