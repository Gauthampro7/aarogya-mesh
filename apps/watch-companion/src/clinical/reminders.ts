/**
 * Deterministic `PATIENT_FAMILY` Reminder Projector for Tier-0 Watch.
 *
 * Projects synced `VaccinationDueItem` records and open `PATIENT_FAMILY`
 * medication/care `ActionCard` items into glanceable, priority-ordered
 * watch reminders in English and pure *Shuddh Tatsama* Hindi.
 */

import {
  ActionCard,
  ActionCardPriority,
  ActionCardStatus,
  VaccinationDueItem,
  VaccinationStatus,
} from "../../../../packages/contracts/ts/index";

export type WatchReminderCategory = "VACCINATION" | "MEDICATION" | "CARE";

export interface WatchReminderItem {
  id: string;
  category: WatchReminderCategory;
  priority: ActionCardPriority;
  status: VaccinationStatus | ActionCardStatus;
  dueBy: string | null;
  daysDelta: number | null;
  titleEn: string;
  titleHi: string;
  messageEn: string;
  messageHi: string;
  title: string;
  message: string;
  sourceCardId: string | null;
  vaccineCode: string | null;
}

export interface ReminderProjectionInput {
  vaccinations?: readonly VaccinationDueItem[];
  actionCards?: readonly ActionCard[];
  language?: "en" | "hi";
  includeUpcoming?: boolean;
  includeAcknowledged?: boolean;
}

const PRIORITY_RANK: Readonly<Record<ActionCardPriority, number>> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

const MEDICATION_KEYWORDS = [
  "medication",
  "medicine",
  "tablet",
  "syrup",
  "dose",
  "ors",
  "zinc",
  "ifa",
  "iron",
  "folic",
  "calcium",
  "paracetamol",
  "amoxicillin",
  "albendazole",
  "antibiotic",
  "औषधि",
] as const;

function isMedicationActionCard(card: ActionCard): boolean {
  const haystack = [card.title, card.summary, ...card.action_steps]
    .join(" ")
    .toLowerCase();
  return MEDICATION_KEYWORDS.some((kw) => haystack.includes(kw));
}

function formatVaccinationReminder(
  item: VaccinationDueItem,
  language: "en" | "hi",
  includeUpcoming: boolean,
): WatchReminderItem | null {
  if (item.status === "COMPLETED") {
    return null;
  }
  if (item.status === "UPCOMING" && !includeUpcoming) {
    return null;
  }

  let priority: ActionCardPriority;
  let titleEn: string;
  let titleHi: string;
  let messageEn: string;
  let messageHi: string;

  if (item.status === "OVERDUE") {
    const overdueDays = Math.abs(item.days_delta);
    priority = "HIGH";
    titleEn = `Overdue Vaccine: ${item.vaccine_name} (${item.dose_label})`;
    titleHi = `अतिदेय टीकाकरण: ${item.vaccine_name} (${item.dose_label})`;
    messageEn =
      item.reminder_text.trim().length > 0
        ? item.reminder_text
        : `Overdue by ${overdueDays} day(s) (due ${item.due_date}). Visit VHND/PHC with MCP Card.`;
    messageHi = `${overdueDays} दिवस अतिदेय (निर्धारित तिथि ${item.due_date})। मातृ-शिशु सुरक्षा पत्रक सहित निकटतम प्राथमिक स्वास्थ्य केंद्र पर जाएं।`;
  } else if (item.status === "DUE_SOON") {
    priority = "MEDIUM";
    titleEn = `Vaccine Due Soon: ${item.vaccine_name} (${item.dose_label})`;
    titleHi = `शीघ्र देय टीकाकरण: ${item.vaccine_name} (${item.dose_label})`;
    messageEn =
      item.reminder_text.trim().length > 0
        ? item.reminder_text
        : item.days_delta === 0
          ? `Due today (${item.due_date}). Visit VHND/PHC with MCP Card.`
          : `Due in ${item.days_delta} day(s) (${item.due_date}). Prepare MCP Card.`;
    messageHi =
      item.days_delta === 0
        ? `अद्य देय (${item.due_date})। मातृ-शिशु सुरक्षा पत्रक सहित प्राथमिक स्वास्थ्य केंद्र पर जाएं।`
        : `${item.days_delta} दिवस में देय (${item.due_date})। टीकाकरण हेतु मातृ-शिशु सुरक्षा पत्रक प्रस्तुत रखें।`;
  } else {
    priority = "LOW";
    titleEn = `Upcoming Vaccine: ${item.vaccine_name} (${item.dose_label})`;
    titleHi = `आगामी टीकाकरण: ${item.vaccine_name} (${item.dose_label})`;
    messageEn =
      item.reminder_text.trim().length > 0
        ? item.reminder_text
        : `Scheduled on ${item.due_date} (in ${item.days_delta} day(s)).`;
    messageHi = `निर्धारित तिथि ${item.due_date} (${item.days_delta} दिवस शेष)।`;
  }

  return {
    id: `vax:${item.vaccine_code}:${item.dose_label}`,
    category: "VACCINATION",
    priority,
    status: item.status,
    dueBy: item.due_date,
    daysDelta: item.days_delta,
    titleEn,
    titleHi,
    messageEn,
    messageHi,
    title: language === "hi" ? titleHi : titleEn,
    message: language === "hi" ? messageHi : messageEn,
    sourceCardId: null,
    vaccineCode: item.vaccine_code,
  };
}

function formatActionCardReminder(
  card: ActionCard,
  language: "en" | "hi",
  includeAcknowledged: boolean,
): WatchReminderItem | null {
  if (card.watch_mode !== null && card.watch_mode !== "PATIENT_FAMILY") {
    return null;
  }
  if (card.status === "COMPLETED" || card.status === "DISMISSED") {
    return null;
  }
  if (card.status === "ACKNOWLEDGED" && !includeAcknowledged) {
    return null;
  }

  const isMedication = isMedicationActionCard(card);
  const category: WatchReminderCategory = isMedication ? "MEDICATION" : "CARE";

  const titleEn = card.title;
  const messageEn = card.summary;

  let titleHi: string;
  let messageHi: string;

  if (card.language === "hi") {
    titleHi = card.title;
    messageHi = card.summary;
  } else if (isMedication) {
    titleHi =
      card.priority === "CRITICAL"
        ? "आपातकालीन औषधि निर्देश"
        : card.priority === "HIGH"
          ? "अति आवश्यक औषधि अनुस्मारक"
          : "औषधि सेवन अनुस्मारक";
    messageHi = card.due_by
      ? `निर्धारित तिथि ${card.due_by} तक नियमित औषधि सेवन एवं स्वास्थ्य कार्यकर्ता निर्देशों का पालन करें।`
      : "नियमित औषधि सेवन एवं स्वास्थ्य कार्यकर्ता निर्देशों का पालन करें।";
  } else {
    titleHi =
      card.priority === "CRITICAL"
        ? "गंभीर आपातकाल: तत्काल चिकित्सालय संदर्भ"
        : "गृह परिचर्या अनुस्मारक";
    messageHi =
      card.priority === "CRITICAL"
        ? "रोगी वाहन 108 पर तत्काल संपर्क करें एवं निकटतम चिकित्सालय ले जाएं।"
        : "स्वास्थ्य कार्यकर्ता द्वारा निर्दिष्ट गृह परिचर्या एवं परीक्षण का पालन करें।";
  }

  return {
    id: `card:${card.card_id}`,
    category,
    priority: card.priority,
    status: card.status,
    dueBy: card.due_by,
    daysDelta: null,
    titleEn,
    titleHi,
    messageEn,
    messageHi,
    title: language === "hi" ? titleHi : titleEn,
    message: language === "hi" ? messageHi : messageEn,
    sourceCardId: card.card_id,
    vaccineCode: null,
  };
}

function compareReminders(a: WatchReminderItem, b: WatchReminderItem): number {
  const rankDiff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  if (rankDiff !== 0) {
    return rankDiff;
  }

  if (a.dueBy !== b.dueBy) {
    if (a.dueBy === null) return 1;
    if (b.dueBy === null) return -1;
    const dateDiff = a.dueBy.localeCompare(b.dueBy);
    if (dateDiff !== 0) return dateDiff;
  }

  const deltaA = a.daysDelta ?? Number.MAX_SAFE_INTEGER;
  const deltaB = b.daysDelta ?? Number.MAX_SAFE_INTEGER;
  if (deltaA !== deltaB) {
    return deltaA - deltaB;
  }

  return a.id.localeCompare(b.id);
}

/**
 * Projects synced `VaccinationDueItem` records and `PATIENT_FAMILY` `ActionCard`s
 * into compact, priority-sorted watch reminders.
 *
 * Mapping:
 * - `OVERDUE` vaccination -> `HIGH`
 * - `DUE_SOON` vaccination -> `MEDIUM`
 * - `COMPLETED` vaccination / `COMPLETED` or `DISMISSED` ActionCard -> hidden
 */
export function projectPatientFamilyReminders(
  input: ReminderProjectionInput,
): WatchReminderItem[] {
  const language: "en" | "hi" = input.language === "hi" ? "hi" : "en";
  const includeUpcoming = input.includeUpcoming ?? false;
  const includeAcknowledged = input.includeAcknowledged ?? false;

  const items: WatchReminderItem[] = [];

  for (const vax of input.vaccinations ?? []) {
    const projected = formatVaccinationReminder(vax, language, includeUpcoming);
    if (projected !== null) {
      items.push(projected);
    }
  }

  for (const card of input.actionCards ?? []) {
    const projected = formatActionCardReminder(card, language, includeAcknowledged);
    if (projected !== null) {
      items.push(projected);
    }
  }

  items.sort(compareReminders);
  return items;
}
