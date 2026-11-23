/**
 * Pure UI state & action controller for the Tier-0 360x360 dual-mode Watch Companion.
 *
 * Delegates all persistence, HLC/CRDT projection, clinical danger-sign triage,
 * reminder projection, and delta/blob sync to `src/core/`, `src/clinical/`, and `src/sync/`.
 */

import type {
  ActionCard,
  CrdtEvent,
  TriageAssessment,
  TriageSeverity,
  VaccinationDueItem,
  WatchMode,
} from "../../../../packages/contracts/ts/index";
import {
  WATCH_DANGER_SIGNS,
  projectPatientFamilyReminders,
  type WatchDangerCategory,
  type WatchDangerSignDefinition,
  type WatchDangerSignFlag,
  type WatchReminderItem,
} from "../clinical/index";
import { resolveDefaultStorage, type StorageLike } from "../core/index";
import { getLang, setLang, toggleLang, type Lang } from "../i18n/index";
import {
  DEFAULT_HUB_URL,
  WatchSyncClient,
  type VoiceSosInput,
  type WatchSyncResult,
} from "../sync/index";
import { WatchKernel } from "../watch_kernel";

export type ChwTab = "danger" | "cards" | "sync";
export type FamilyTab = "reminders" | "sos" | "sync";
export type WatchTab = ChwTab | FamilyTab;

export interface TriageBannerState {
  severity: TriageSeverity;
  assessment: TriageAssessment;
  actionCard: ActionCard | null;
  event: CrdtEvent;
}

export interface WatchUiControllerOptions {
  kernel: WatchKernel;
  syncClient: WatchSyncClient;
  storage?: StorageLike;
  hubUrlStorageKey?: string;
  initialVaccinations?: readonly VaccinationDueItem[];
}

export const DEFAULT_HUB_URL_STORAGE_KEY = "aarogya.watch.hubUrl";
const DEFAULT_WALKIN_PATIENT_ID = "watch-walkin";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isVaccinationDueItem(v: unknown): v is VaccinationDueItem {
  if (!isRecord(v)) return false;
  return (
    typeof v.vaccine_code === "string" &&
    typeof v.vaccine_name === "string" &&
    typeof v.dose_label === "string" &&
    typeof v.due_date === "string" &&
    typeof v.status === "string" &&
    typeof v.days_delta === "number" &&
    typeof v.reminder_text === "string" &&
    typeof v.schedule_group === "string"
  );
}

function extractSyncedVaccinations(events: readonly CrdtEvent[]): VaccinationDueItem[] {
  const byKey = new Map<string, VaccinationDueItem>();
  for (const evt of events) {
    const payload = evt.payload;
    if (!isRecord(payload)) continue;

    if (isVaccinationDueItem(payload)) {
      byKey.set(`${payload.vaccine_code}:${payload.dose_label}`, payload);
    } else if (Array.isArray(payload.vaccinations)) {
      for (const item of payload.vaccinations) {
        if (isVaccinationDueItem(item)) {
          byKey.set(`${item.vaccine_code}:${item.dose_label}`, item);
        }
      }
    }
  }
  return Array.from(byKey.values());
}

export class WatchUiController {
  private readonly kernel: WatchKernel;
  private readonly syncClient: WatchSyncClient;
  private readonly storage: StorageLike;
  private readonly hubUrlStorageKey: string;
  private readonly listeners = new Set<() => void>();

  private activeTab: WatchTab;
  private dangerCategory: WatchDangerCategory = "PEDIATRIC";
  private patientIdInput = "";
  private lastTriage: TriageBannerState | null = null;
  private sosQueuedEvent: CrdtEvent | null = null;
  private sosTextDraft = "";
  private isSyncing = false;
  private lastSyncResult: WatchSyncResult | null = null;
  private seededVaccinations: VaccinationDueItem[];

  constructor(options: WatchUiControllerOptions) {
    this.kernel = options.kernel;
    this.syncClient = options.syncClient;
    this.storage = options.storage ?? resolveDefaultStorage();
    this.hubUrlStorageKey = options.hubUrlStorageKey ?? DEFAULT_HUB_URL_STORAGE_KEY;
    this.seededVaccinations = [...(options.initialVaccinations ?? [])];

    const savedHubUrl = this.storage.getItem(this.hubUrlStorageKey);
    if (savedHubUrl && savedHubUrl.trim().length > 0) {
      this.syncClient.setHubUrl(savedHubUrl);
    }

    this.activeTab = this.defaultTabForMode(this.kernel.getWatchMode());
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  private defaultTabForMode(mode: WatchMode): WatchTab {
    return mode === "CHW_COMPANION" ? "danger" : "reminders";
  }

  public getMode(): WatchMode {
    return this.kernel.getWatchMode();
  }

  public setMode(mode: WatchMode): WatchMode {
    const updated = this.kernel.setWatchMode(mode);
    this.activeTab = this.defaultTabForMode(updated);
    this.emit();
    return updated;
  }

  public toggleMode(): WatchMode {
    const updated = this.kernel.toggleWatchMode();
    this.activeTab = this.defaultTabForMode(updated);
    this.emit();
    return updated;
  }

  public getTab(): WatchTab {
    return this.activeTab;
  }

  public setTab(tab: WatchTab): WatchTab {
    const mode = this.getMode();
    if (mode === "CHW_COMPANION" && (tab === "reminders" || tab === "sos")) {
      this.activeTab = "danger";
    } else if (mode === "PATIENT_FAMILY" && (tab === "danger" || tab === "cards")) {
      this.activeTab = "reminders";
    } else {
      this.activeTab = tab;
    }
    this.emit();
    return this.activeTab;
  }

  public getLanguage(): Lang {
    return getLang();
  }

  public setLanguage(lang: Lang): Lang {
    const updated = setLang(lang);
    this.emit();
    return updated;
  }

  public toggleLanguage(): Lang {
    const updated = toggleLang();
    this.emit();
    return updated;
  }

  public getDangerCategory(): WatchDangerCategory {
    return this.dangerCategory;
  }

  public setDangerCategory(category: WatchDangerCategory): void {
    this.dangerCategory = category;
    this.emit();
  }

  public getDangerSignsForCategory(
    category: WatchDangerCategory = this.dangerCategory,
  ): readonly WatchDangerSignDefinition[] {
    return WATCH_DANGER_SIGNS.filter((sign) => sign.category === category);
  }

  public getPatientIdInput(): string {
    return this.patientIdInput;
  }

  public setPatientIdInput(value: string): void {
    this.patientIdInput = value;
  }

  public getLastTriage(): TriageBannerState | null {
    return this.lastTriage;
  }

  public resetTriage(): void {
    this.lastTriage = null;
    this.emit();
  }

  /**
   * 1-tap danger-sign screening: tapping any danger sign immediately evaluates via
   * `WatchKernel.screenDangerSigns` (emitting `RED_EMERGENCY` + companion `ACTION_CARD_ISSUED`).
   * Passing an empty list evaluates a clean `GREEN_HOME` screen.
   */
  public triggerDangerScreen(
    flags: readonly WatchDangerSignFlag[],
    patientIdOverride?: string,
  ): TriageBannerState {
    const patientId =
      (patientIdOverride ?? this.patientIdInput).trim() || DEFAULT_WALKIN_PATIENT_ID;
    const result = this.kernel.screenDangerSigns(
      {
        patientId,
        dangerSigns: flags,
        language: getLang(),
      },
      { persistActionCard: true },
    );
    this.lastTriage = {
      severity: result.severity,
      assessment: result.assessment,
      actionCard: result.actionCard,
      event: result.event,
    };
    this.emit();
    return this.lastTriage;
  }

  public getVisibleActionCards(): ActionCard[] {
    return this.kernel.getVisibleActionCards();
  }

  public getOpenActionCardCount(): number {
    return this.kernel
      .getVisibleActionCards()
      .filter((card) => card.status === "OPEN").length;
  }

  public acknowledgeCard(cardId: string): CrdtEvent {
    const event = this.syncClient.ackActionCard(cardId);
    this.emit();
    return event;
  }

  public setVaccinations(items: readonly VaccinationDueItem[]): void {
    this.seededVaccinations = [...items];
    this.emit();
  }

  public getReminders(): WatchReminderItem[] {
    const store = this.kernel.getStore();
    const synced = extractSyncedVaccinations(store.getEvents());
    const merged = new Map<string, VaccinationDueItem>();
    for (const item of this.seededVaccinations) {
      merged.set(`${item.vaccine_code}:${item.dose_label}`, item);
    }
    for (const item of synced) {
      merged.set(`${item.vaccine_code}:${item.dose_label}`, item);
    }
    return projectPatientFamilyReminders({
      vaccinations: Array.from(merged.values()),
      actionCards: store.getVisibleActionCards("PATIENT_FAMILY"),
      language: getLang(),
    });
  }

  public getSosTextDraft(): string {
    return this.sosTextDraft;
  }

  public setSosTextDraft(value: string): void {
    this.sosTextDraft = value;
  }

  public getLastSosEvent(): CrdtEvent | null {
    return this.sosQueuedEvent;
  }

  public async submitSos(input: VoiceSosInput = {}): Promise<CrdtEvent> {
    const event = await this.syncClient.enqueueVoiceSos({
      patientId: input.patientId ?? (this.patientIdInput.trim() || null),
      transcriptHint: input.transcriptHint ?? (this.sosTextDraft.trim() || undefined),
      language: input.language ?? getLang(),
      audioBlob: input.audioBlob ?? null,
      mimeType: input.mimeType ?? null,
      durationMs: input.durationMs ?? 0,
    });
    this.sosQueuedEvent = event;
    this.sosTextDraft = "";
    this.emit();
    return event;
  }

  public getHubUrl(): string {
    return this.syncClient.getHubUrl();
  }

  public setHubUrl(hubUrl: string): string {
    const normalized = this.syncClient.setHubUrl(hubUrl || DEFAULT_HUB_URL);
    try {
      this.storage.setItem(this.hubUrlStorageKey, normalized);
    } catch {
      // Fail-soft if storage quota exceeded.
    }
    this.emit();
    return normalized;
  }

  public getOutboxCount(): number {
    return this.kernel.getStore().getOutboxEventIds().length;
  }

  public getIsSyncing(): boolean {
    return this.isSyncing;
  }

  public getLastSyncResult(): WatchSyncResult | null {
    return this.lastSyncResult;
  }

  public async syncNow(): Promise<WatchSyncResult> {
    this.isSyncing = true;
    this.emit();
    try {
      const result = await this.syncClient.syncNow();
      this.lastSyncResult = result;
      return result;
    } finally {
      this.isSyncing = false;
      this.emit();
    }
  }
}
