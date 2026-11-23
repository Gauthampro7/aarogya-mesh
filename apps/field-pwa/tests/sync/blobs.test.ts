import { describe, expect, it } from "vitest";
import type { SyncEnvelope } from "../../../../packages/contracts/ts/index";
import { SyncEngine, isValidBlobKey, uploadBlobIfMissing, type WsLike } from "../../src/sync";
import { freshStore, reply } from "./helpers";

type Call = { method: string; url: string; contentType?: string; body?: Uint8Array };
type Mode = "ok" | "offline" | 500 | 400;

/** Fake hub: blob store + /api/v1/sync that acks everything it receives. */
function fakeHub(initial: Record<string, Uint8Array> = {}) {
  const blobs = new Map(Object.entries(initial));
  const calls: Call[] = [];
  const syncs: SyncEnvelope[] = [];
  const hub = { blobs, calls, syncs, blobMode: "ok" as Mode, syncMode: "ok" as Mode, fn: null as unknown as typeof fetch };
  hub.fn = (async (url: string, init: RequestInit = {}) => {
    const method = init.method ?? "GET";
    const call: Call = { method, url };
    calls.push(call);
    if (url.endsWith("/api/v1/sync")) {
      if (hub.syncMode === "offline") throw new TypeError("Failed to fetch");
      if (typeof hub.syncMode === "number") return new Response("x", { status: hub.syncMode });
      const env = JSON.parse(String(init.body)) as SyncEnvelope;
      syncs.push(env);
      return new Response(JSON.stringify(reply({ ack_event_ids: env.events.map((e) => e.event_id) })), { status: 200 });
    }
    if (hub.blobMode === "offline") throw new TypeError("Failed to fetch");
    const key = decodeURIComponent(url.split("/api/v1/blobs/")[1]);
    if (method === "HEAD") return new Response(null, { status: blobs.has(key) ? 200 : 404 });
    call.contentType = new Headers(init.headers).get("content-type") ?? undefined;
    call.body = new Uint8Array(await (init.body as Blob).arrayBuffer());
    if (typeof hub.blobMode === "number") return new Response("x", { status: hub.blobMode });
    blobs.set(key, call.body);
    return new Response(JSON.stringify({ blob_key: key }), { status: 200 });
  }) as unknown as typeof fetch;
  return hub;
}

class Ws implements WsLike {
  readyState = 0;
  sent: SyncEnvelope[] = [];
  onopen: WsLike["onopen"] = null;
  onclose: WsLike["onclose"] = null;
  onerror: WsLike["onerror"] = null;
  onmessage: WsLike["onmessage"] = null;
  send(d: string) {
    this.sent.push(JSON.parse(d));
  }
  close() {
    this.readyState = 3;
  }
  open() {
    this.readyState = 1;
    this.onopen?.({});
  }
}
const { setImmediate: immediate } = globalThis as unknown as { setImmediate: (f: () => void) => void };
const flush = async () => {
  for (let i = 0; i < 50; i++) await new Promise<void>((r) => immediate(r));
};

const blobCalls = (calls: Call[]) => calls.filter((c) => c.url.includes("/blobs/")).map((c) => c.method);
const bytes = new Uint8Array([1, 2, 3, 250]);
const clip = () => new Blob([bytes], { type: "audio/webm" });
const voice = (eng: SyncEngine, key: string | null) =>
  eng.enqueue({
    event_type: "VOICE_NOTE_RECORDED",
    payload: { audio_blob_key: key, mime_type: "audio/webm", transcript_hint: "" },
    enrichment_state: "PENDING",
  });

describe("uploadBlobIfMissing", () => {
  it("HEAD 404 -> PUT uploads exact bytes + Content-Type, no-store", async () => {
    const hub = fakeHub();
    let init: RequestInit | undefined;
    const spy = ((u: string, i: RequestInit) => ((init = i), hub.fn(u, i))) as unknown as typeof fetch;
    expect(await uploadBlobIfMissing("http://hub/", "vn-1", async () => clip(), spy)).toBe("uploaded");
    expect(hub.calls.map((c) => `${c.method} ${c.url}`)).toEqual(["HEAD http://hub/api/v1/blobs/vn-1", "PUT http://hub/api/v1/blobs/vn-1"]);
    expect(hub.calls[1].contentType).toBe("audio/webm");
    expect([...hub.blobs.get("vn-1")!]).toEqual([...bytes]);
    expect(init?.cache).toBe("no-store");
  });

  it("HEAD 200 skips the PUT and never loads the local clip", async () => {
    const hub = fakeHub({ "vn-1": bytes });
    let loaded = false;
    expect(await uploadBlobIfMissing("http://hub", "vn-1", async () => ((loaded = true), clip()), hub.fn)).toBe("present");
    expect(blobCalls(hub.calls)).toEqual(["HEAD"]);
    expect(loaded).toBe(false);
  });

  it("defaults Content-Type to application/octet-stream", async () => {
    const hub = fakeHub();
    await uploadBlobIfMissing("http://hub", "vn-2", async () => new Blob([bytes]), hub.fn);
    expect(hub.calls[1].contentType).toBe("application/octet-stream");
  });

  it("rejects invalid keys without any request", async () => {
    const hub = fakeHub();
    for (const k of ["", "../etc", "a..b", "-x", "a/b", "a b", "x".repeat(129)]) {
      expect(isValidBlobKey(k)).toBe(false);
      expect(await uploadBlobIfMissing("http://hub", k, async () => clip(), hub.fn)).toBe("rejected");
    }
    expect(hub.calls).toHaveLength(0);
    expect(isValidBlobKey("vn-0f3a.webm_1")).toBe(true);
  });

  it("classifies offline / 5xx as transient errors and 4xx as rejected", async () => {
    const hub = fakeHub();
    hub.blobMode = "offline";
    await expect(uploadBlobIfMissing("http://hub", "vn-1", async () => clip(), hub.fn)).rejects.toMatchObject({ kind: "offline" });
    hub.blobMode = 500;
    await expect(uploadBlobIfMissing("http://hub", "vn-1", async () => clip(), hub.fn)).rejects.toMatchObject({ kind: "error" });
    hub.blobMode = 400;
    expect(await uploadBlobIfMissing("http://hub", "vn-1", async () => clip(), hub.fn)).toBe("rejected");
  });

  it("one deadline covers the whole exchange (stalled PUT body times out)", async () => {
    const fn = (async (_u: string, init: RequestInit) =>
      init.method === "HEAD"
        ? new Response(null, { status: 404 })
        : { ok: true, status: 200, text: () => new Promise((_, rej) => init.signal!.addEventListener("abort", () => rej(new Error("aborted")))) }) as unknown as typeof fetch;
    await expect(uploadBlobIfMissing("http://hub", "vn-1", async () => clip(), fn, 20)).rejects.toMatchObject({ kind: "error" });
  });
});

describe("SyncEngine voice blob sync", () => {
  it("uploads the clip before the envelope push", async () => {
    const s = await freshStore();
    const hub = fakeHub();
    const eng = new SyncEngine(s, { fetchImpl: hub.fn, getAudioBlob: async (k) => (k === "vn-a" ? clip() : undefined) });
    await voice(eng, "vn-a");
    expect(await eng.syncNow()).not.toBeNull();
    expect(hub.calls.map((c) => c.method)).toEqual(["HEAD", "PUT", "POST"]);
    expect([...hub.blobs.get("vn-a")!]).toEqual([...bytes]);
    expect(await s.getPendingEvents()).toHaveLength(0);
    expect(eng.status).toBe("idle");
  });

  it("typed-only notes (audio_blob_key: null) make zero blob calls", async () => {
    const s = await freshStore();
    const hub = fakeHub();
    let loads = 0;
    const eng = new SyncEngine(s, { fetchImpl: hub.fn, getAudioBlob: async () => (loads++, clip()) });
    await voice(eng, null);
    await eng.syncNow();
    expect(blobCalls(hub.calls)).toEqual([]);
    expect(loads).toBe(0);
    expect(await s.getPendingEvents()).toHaveLength(0);
  });

  it("blob already on hub: HEAD only, no PUT", async () => {
    const s = await freshStore();
    const hub = fakeHub({ "vn-a": bytes });
    const eng = new SyncEngine(s, { fetchImpl: hub.fn, getAudioBlob: async () => clip() });
    await voice(eng, "vn-a");
    await eng.syncNow();
    expect(hub.calls.map((c) => c.method)).toEqual(["HEAD", "POST"]);
  });

  it("blob failure still pushes events, keeps the voice event in the outbox, retries next sync", async () => {
    const s = await freshStore();
    const hub = fakeHub();
    const eng = new SyncEngine(s, { fetchImpl: hub.fn, getAudioBlob: async () => clip() });
    const v = await voice(eng, "vn-a");
    const other = await eng.enqueue({ event_type: "CHECKLIST_RECORDED", payload: {} });
    for (const mode of ["offline", 500] as const) {
      hub.blobMode = mode;
      expect(await eng.syncNow()).not.toBeNull(); // never throws, event push not blocked
      expect(eng.status).toBe(mode === "offline" ? "offline" : "error");
      expect(hub.syncs.at(-1)!.events.map((e) => e.event_id)).toContain(v.event_id);
      expect((await s.getPendingEvents()).map((e) => e.event_id)).toEqual([v.event_id]);
    }
    expect((await s.getAllEvents()).map((e) => e.event_id)).toContain(other.event_id);
    hub.blobMode = "ok";
    await eng.syncNow();
    expect(hub.blobs.has("vn-a")).toBe(true);
    expect(await s.getPendingEvents()).toHaveLength(0);
    expect(eng.status).toBe("idle");
  });

  it("offline hub: blob + sync both fail soft, outbox intact", async () => {
    const s = await freshStore();
    const hub = fakeHub();
    hub.blobMode = hub.syncMode = "offline";
    const eng = new SyncEngine(s, { fetchImpl: hub.fn, getAudioBlob: async () => clip() });
    await voice(eng, "vn-a");
    await voice(eng, "vn-b");
    expect(await eng.syncNow()).toBeNull();
    expect(eng.status).toBe("offline");
    expect(blobCalls(hub.calls)).toEqual(["HEAD"]); // first offline short-circuits the rest
    expect(await s.getPendingEvents()).toHaveLength(2);
  });

  it("clip missing on device or invalid key does not pin the event", async () => {
    const s = await freshStore();
    const hub = fakeHub();
    const eng = new SyncEngine(s, { fetchImpl: hub.fn, getAudioBlob: async () => undefined });
    await voice(eng, "vn-gone");
    await voice(eng, "../bad");
    expect(await eng.syncNow()).not.toBeNull();
    expect(blobCalls(hub.calls)).toEqual(["HEAD"]);
    expect(await s.getPendingEvents()).toHaveLength(0);
    expect(eng.status).toBe("idle");
  });

  it("a throwing local audio store is transient and does not throw out of syncNow", async () => {
    const s = await freshStore();
    const hub = fakeHub();
    let fail = true;
    const eng = new SyncEngine(s, {
      fetchImpl: hub.fn,
      getAudioBlob: async () => {
        if (fail) throw new Error("idb broke");
        return clip();
      },
    });
    const v = await voice(eng, "vn-a");
    expect(await eng.syncNow()).not.toBeNull();
    expect((await s.getPendingEvents()).map((e) => e.event_id)).toEqual([v.event_id]);
    fail = false;
    await eng.syncNow();
    expect(await s.getPendingEvents()).toHaveLength(0);
  });

  it("enqueue is not blocked while a blob upload stalls", async () => {
    const s = await freshStore();
    const eng = new SyncEngine(s, { fetchImpl: (() => new Promise(() => {})) as unknown as typeof fetch, getAudioBlob: async () => clip() });
    await voice(eng, "vn-a");
    void eng.syncNow();
    const e = await eng.enqueue({ event_type: "CHECKLIST_RECORDED", payload: {} });
    expect(await s.getEvent(e.event_id)).toBeDefined();
  });

  it("mesh push uploads clips first and only tracks acks for events whose clip landed", async () => {
    const s = await freshStore();
    const hub = fakeHub();
    hub.blobMode = 500;
    const sockets: Ws[] = [];
    const wsFactory = () => {
      const ws = new Ws();
      sockets.push(ws);
      return ws;
    };
    const eng = new SyncEngine(s, { fetchImpl: hub.fn, wsFactory, getAudioBlob: async () => clip() });
    const v = await voice(eng, "vn-a");
    eng.startMesh();
    sockets[0].open();
    await flush();
    expect(sockets[0].sent).toHaveLength(1);
    expect(sockets[0].sent[0].events.map((e) => e.event_id)).toEqual([v.event_id]);
    expect(hub.calls.map((c) => c.method)).toEqual(["HEAD", "PUT"]); // before the WS send
    expect(eng.status).toBe("error");
    sockets[0].onmessage?.({ data: JSON.stringify(reply({ ack_event_ids: [v.event_id] })) });
    await flush();
    expect(await s.getPendingEvents()).toHaveLength(1); // ack ignored: clip not on hub yet
    eng.stopMesh();
  });
});
