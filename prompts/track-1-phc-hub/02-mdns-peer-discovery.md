# T1-02 — Tier-2 PHC Hub mDNS Peer Discovery & Offline Connect Helper

- **Task ID**: `T1-02`
- **Track & Owner**: Track 1 — `services/phc-hub/` (Core Bedrock / Gautham)
- **Branch**: `feat/phc-hub-mdns-discovery`
- **Allowed Paths**:
  - `services/phc-hub/src/aarogya_phc_hub/discovery.py` (new)
  - `services/phc-hub/src/aarogya_phc_hub/app.py` (track seen peers on sync/WS + expose `GET /api/v1/peers` and `GET /api/v1/discovery/connect-info`)
  - `services/phc-hub/pyproject.toml` (optional `zeroconf` dependency only if coordinated, or pure stdlib fallback + optional import)
  - `services/phc-hub/tests/test_discovery.py` (new)
- **Forbidden Paths**: `packages/contracts/`, `packages/clinical-engine/`, `packages/crdt-sync/`, `services/ml-pipeline/`, `apps/`, root `pyproject.toml`
- **Depends On**: None

---

## Copy-Paste Starter Prompt

```text
You are working on Aarogya Mesh (`/home/gautham/Personal/Gautham/Hackathon/1/aarogya-mesh`), Task T1-02.
First read `AGENTS.md`, `ARCHITECTURE.md`, and `services/phc-hub/src/aarogya_phc_hub/app.py`.

Goal: Add offline LAN/Hotspot peer discovery (`_aarogya-mesh._tcp.local.`), a live peer registry, and a zero-internet connection/QR helper so Tier-1 Phones and Tier-0 Watches can discover and pair with the Tier-2 PHC Hub during the Airplane-Mode demo.

Hard Constraints:
1. Only touch Allowed Paths: `services/phc-hub/src/aarogya_phc_hub/{discovery,app}.py`, `services/phc-hub/pyproject.toml`, and `services/phc-hub/tests/test_discovery.py`.
2. Zero-Internet & CI-Safe mDNS: Implement `MdnsAdvertiser` targeting service type `_aarogya-mesh._tcp.local.` with TXT records (`node_id`, `tier`, `schema_version`). Gracefully degrade to a clean no-op with `mdns_active=False` if `zeroconf` is unavailable or multicast sockets are blocked (so Linux CI and unit tests never fail or hang).
3. Unified `PeerRegistry`: Record peers from BOTH mDNS announcements and live `SyncEnvelope.sender_manifest` arrivals in `POST /api/v1/sync` and `WS /ws/mesh`. Store strict `PeerRecord(manifest: HardwareCapabilityManifest, last_seen_ms: int, source: Literal["mdns", "http_sync", "ws_mesh"], address: str | None)`.
4. Expose two read-only endpoints on `create_app`:
   - `GET /api/v1/peers` -> `list[PeerRecord]` sorted by `last_seen_ms` descending.
   - `GET /api/v1/discovery/connect-info` -> `HubConnectInfo(node_id, tier, mdns_service_type, mdns_active, lan_ip, port, http_url, ws_url, pairing_payload)` where `lan_ip` uses a non-blocking stdlib UDP socket probe (falling back to `127.0.0.1`) and `pairing_payload` is a compact JSON string suitable for offline QR rendering.
5. Keep `enable_mdns: bool = False` by default in `create_app(...)` (opt-in via `AAROGYA_HUB_ENABLE_MDNS=1` on module-level `app`) so unit tests never open multicast sockets.
6. Zero PyTorch/CUDA bloat and keep diff <300 LOC. Run `make verify` before finishing.
```

---

## Step-by-Step Checklist

1. Create `services/phc-hub/src/aarogya_phc_hub/discovery.py` with Pydantic models `PeerRecord` and `HubConnectInfo` (`extra="forbid"`), thread-safe `PeerRegistry`, `detect_lan_ip()`, and fail-soft `MdnsAdvertiser` (`_aarogya-mesh._tcp.local.`).
2. Attach `hub_app.state.peer_registry` and `hub_app.state.mdns_advertiser` in `create_app(...)` (registering/unregistering cleanly inside FastAPI `lifespan` when `enable_mdns=True`).
3. Update `POST /api/v1/sync` and `WS /ws/mesh` in `services/phc-hub/src/aarogya_phc_hub/app.py` to call `peer_registry.record_peer(incoming.sender_manifest, source=...)` on every valid `SyncEnvelope`.
4. Add `GET /api/v1/peers` and `GET /api/v1/discovery/connect-info` endpoints.
5. Write `services/phc-hub/tests/test_discovery.py` covering `PeerRegistry` upsert/ordering, `GET /api/v1/peers` after HTTP + WS sync, `GET /api/v1/discovery/connect-info` URL/pairing format, and fail-soft `MdnsAdvertiser` fallback when `zeroconf` is absent or disabled.

---

## Verification Commands & Definition of Done

```bash
uv run pytest -v services/phc-hub/tests/test_discovery.py services/phc-hub/tests/test_hub_api.py
make verify
```

- [ ] `POST /api/v1/sync` and `WS /ws/mesh` automatically register Tier-1 Phone and Tier-0 Watch manifests in `GET /api/v1/peers`.
- [ ] `GET /api/v1/discovery/connect-info` returns valid local `http://<lan_ip>:8000` and `ws://<lan_ip>:8000/ws/mesh` URLs with zero external network calls.
- [ ] `MdnsAdvertiser` advertises `_aarogya-mesh._tcp.local.` when enabled and degrades cleanly without crashing in offline/CI environments.
- [ ] `make verify` passes (8/8 schemas, 0 ruff errors, all tests passing).
