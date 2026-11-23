/**
 * SyncEngine: durable outbox <-> Tier-2 hub. Fail-soft: network/hub failures only
 * change status; the outbox stays intact and local actions never wait on the hub.
 */
import type { CrdtEvent, SyncEnvelope } from "../../../../packages/contracts/ts/index";
import type { FieldStore } from "../core";
import { applyResponse, countPendingEnrichments, materialize, rebuildViews, type ApplyResult } from "./apply";
import { Emitter, type SyncState } from "./emitter";
import { buildEnvelope, createLocalEvent, type LocalEventInput, type ManifestOptions } from "./envelope";
import { postSync, SyncTransportError } from "./transport-http";
import { MeshSocket, type WsFactory } from "./transport-ws";

export interface SyncEngineOptions {
  hubUrl?: string;
  fetchImpl?: typeof fetch;
  wsFactory?: WsFactory;
  manifest?: ManifestOptions;
  wsBaseDelayMs?: number;
  wsMaxDelayMs?: number;
}

export class SyncEngine {
  readonly events = new Emitter();
  hubUrl: string;
  private state: SyncState = "idle";
  /** Network queue: one exchange at a time (may be held across a slow fetch). */
  private queue: Promise<unknown> = Promise.resolve();
  /**
   * View lock: every read-log-then-write-views step (enqueue, rebuild, apply) runs
   * here, so a stale fold can never overwrite a fresher view. It is never held
   * across network I/O, so local actions never wait on the hub.
   */
  private viewQueue: Promise<unknown> = Promise.resolve();
  private mesh: MeshSocket | null = null;
  private viewsReady: Promise<void> | null = null;
  /** Event ids sent over WS and not yet acked; WS replies may only ack these. */
  private wsSent = new Set<string>();

  constructor(readonly store: FieldStore, private readonly opts: SyncEngineOptions = {}) {
    this.hubUrl = opts.hubUrl ?? "http://127.0.0.1:8000";
  }

  get status(): SyncState {
    return this.state;
  }

  async pendingCount(): Promise<number> {
    return (await this.store.getPendingEvents()).length;
  }

  pendingEnrichmentCount(): Promise<number> {
    return countPendingEnrichments(this.store);
  }

  /** Create + persist a local event (log + outbox), materialize it, and push opportunistically. */
  async enqueue(input: LocalEventInput): Promise<CrdtEvent> {
    const { event, pendingEnrichments, cards } = await this.withViews(async () => {
      const event = await createLocalEvent(this.store, input);
      return { event, ...(await materialize(this.store, [event])) };
    });
    if (cards.length) this.events.emit("cards", { cards });
    this.events.emit("enrichment", { pending: pendingEnrichments });
    await this.setState(this.state);
    if (this.mesh?.connected) void this.pushViaMesh();
    return event;
  }

  /** One HTTP exchange. Never throws; resolves null on failure (status says why). */
  syncNow(): Promise<ApplyResult | null> {
    return this.serial(async () => {
      await this.setState("syncing");
      try {
        await this.ensureViews();
        const env = await buildEnvelope(this.store, this.opts.manifest);
        const reply = await postSync(this.hubUrl, env, this.opts.fetchImpl ?? globalThis.fetch);
        return await this.applyReply(reply, env.events.map((e) => e.event_id));
      } catch (err) {
        const kind = err instanceof SyncTransportError ? err.kind : "error";
        await this.setState(kind, String(err instanceof Error ? err.message : err));
        return null;
      }
    });
  }

  /** Open WS /ws/mesh; sends the outbox on every (re)connect and applies replies. */
  startMesh(): void {
    if (this.mesh) return;
    this.mesh = new MeshSocket(MeshSocket.urlFor(this.hubUrl), {
      wsFactory: this.opts.wsFactory,
      baseDelayMs: this.opts.wsBaseDelayMs,
      maxDelayMs: this.opts.wsMaxDelayMs,
      onOpen: () => void this.pushViaMesh(),
      onEnvelope: (env) =>
        void this.serial(() => this.applyReply(env, this.wsSent)).catch((err) => this.setState("error", String(err))),
      onDisconnect: () => void this.setState("offline"),
    });
    this.mesh.start();
  }

  stopMesh(): void {
    this.mesh?.stop();
    this.mesh = null;
  }

  private pushViaMesh(): Promise<void> {
    return this.serial(async () => {
      await this.ensureViews();
      const env = await buildEnvelope(this.store, this.opts.manifest);
      if (this.mesh?.send(env)) env.events.forEach((e) => this.wsSent.add(e.event_id));
      else await this.setState("offline");
    });
  }

  /**
   * Once per engine: re-fold the whole log into patient/card views, repairing a
   * crash between appending events and materializing them. Retried if it fails.
   */
  private ensureViews(): Promise<void> {
    this.viewsReady ??= this.withViews(() => rebuildViews(this.store)).then(
      (pending) => this.events.emit("enrichment", { pending }),
      (err) => {
        this.viewsReady = null;
        throw err;
      },
    );
    return this.viewsReady;
  }

  private async applyReply(reply: SyncEnvelope, sentIds: Iterable<string>): Promise<ApplyResult> {
    const result = await this.withViews(() => applyResponse(this.store, reply, sentIds));
    reply.ack_event_ids.forEach((id) => this.wsSent.delete(id));
    if (result.cards.length) this.events.emit("cards", { cards: result.cards });
    this.events.emit("enrichment", { pending: result.pendingEnrichments });
    await this.setState("idle", undefined, result.rejected);
    return result;
  }

  private async setState(state: SyncState, error?: string, rejected = 0): Promise<void> {
    this.state = state;
    this.events.emit("status", {
      state,
      pendingCount: await this.pendingCount(),
      ...(error ? { error } : {}),
      ...(rejected ? { rejected } : {}),
    });
  }

  private serial<T>(fn: () => Promise<T>): Promise<T> {
    const p = this.queue.then(fn);
    this.queue = p.catch(() => undefined);
    return p;
  }

  private withViews<T>(fn: () => Promise<T>): Promise<T> {
    const p = this.viewQueue.then(fn);
    this.viewQueue = p.catch(() => undefined);
    return p;
  }
}
