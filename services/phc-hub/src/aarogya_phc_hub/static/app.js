(() => {
  "use strict";

  const I18N = {
    en: {
      appTitle: "Aarogya Mesh — Tier-2 PHC Command Center",
      appSubtitle: "Autonomous Offline-First Clinical Mesh Operations",
      badgeTier: "TIER-2 HUB",
      badgeOffline: "AIRPLANE-MODE SAFE",
      langToggle: "हिन्दी",
      themeLight: "Light",
      themeDark: "Dark",
      autoOn: "Auto-Refresh: ON",
      autoOff: "Auto-Refresh: OFF",
      refresh: "Refresh",
      nodeId: "Node ID",
      ram: "RAM",
      cpu: "CPU Cores",
      npu: "NPU",
      npuAvailable: "Available",
      npuAbsent: "None",
      connectUrl: "LAN Connect URL",
      wsUrl: "Mesh WebSocket",
      lastUpdated: "Last Updated",
      patients: "Registered Patients",
      triageRed: "RED Emergency",
      triageYellow: "YELLOW PHC",
      triageGreen: "GREEN Home",
      pendingEnrichments: "Pending Enrichments",
      completedEnrichments: "Completed Enrichments",
      totalEvents: "CRDT Events",
      peerTopology: "Live Peer Topology",
      tier0Label: "Tier-0 Watch",
      tier1Label: "Tier-1 Phone",
      tier2Label: "Tier-2 Hub",
      clinicalPanel: "Clinical Triage & Risk Alerts",
      runEnrichment: "Run Enrichment Now",
      runningEnrichment: "Running Enrichment...",
      enrichmentDone: "Enrichment cycle completed.",
      enrichmentUnavailable: "Enrichment endpoint unavailable.",
      outbreakAlerts: "Outbreak Alerts",
      shapTitle: "SHAP Risk Attributions",
      actionCards: "Action Cards",
      eventLog: "Live HLC CRDT Event Log Inspector",
      filterEvents: "Filter by event type",
      allEvents: "All Events",
      colHlc: "HLC Timestamp",
      colOrigin: "Origin Node",
      colType: "Event Type",
      colPatient: "Patient ID",
      colEnrichment: "Enrichment",
      colSummary: "Payload",
      noPeers: "No mesh peers connected yet.",
      noOutbreaks: "No active outbreak alerts.",
      noShap: "No completed SHAP risk enrichments yet.",
      noActionCards: "No active action cards.",
      noEvents: "No CRDT events recorded yet.",
      battery: "Battery",
      riskScore: "Risk Score",
      outbreakBannerPrefix: "ACTIVE OUTBREAK ALERT",
    },
    hi: {
      appTitle: "आरोग्य संजाल — प्राथमिक स्वास्थ्य केन्द्र नियन्त्रण कक्ष",
      appSubtitle: "स्वावलम्बी अन्तर्जाल-रहित चिकित्सकीय समन्वय प्रणाली",
      badgeTier: "स्तर-२ मुख्य केन्द्र",
      badgeOffline: "अन्तर्जाल-रहित सुरक्षित",
      langToggle: "English",
      themeLight: "प्रकाश रूप",
      themeDark: "रात्रि रूप",
      autoOn: "स्वतः अद्यतन: सक्रिय",
      autoOff: "स्वतः अद्यतन: निष्क्रिय",
      refresh: "अद्यतन करें",
      nodeId: "केन्द्र पहचान",
      ram: "मुख्य स्मृति",
      cpu: "प्रक्रमक क्रोड",
      npu: "तन्त्रिका प्रक्रमक",
      npuAvailable: "उपलब्ध",
      npuAbsent: "अनुपलब्ध",
      connectUrl: "स्थानीय सम्पर्क सूत्र",
      wsUrl: "तत्काल संजाल सूत्र",
      lastUpdated: "अन्तिम अद्यतन",
      patients: "पंजीकृत रोगी",
      triageRed: "रक्त — आपातकाल",
      triageYellow: "पीत — स्वास्थ्य केन्द्र",
      triageGreen: "हरित — गृह देखभाल",
      pendingEnrichments: "प्रतीक्षारत संवर्धन",
      completedEnrichments: "पूर्ण संवर्धन",
      totalEvents: "कुल घटनाएँ",
      peerTopology: "जीवन्त संजाल सहकर्मी संरचना",
      tier0Label: "स्तर-० घटिका",
      tier1Label: "स्तर-१ दूरभाष",
      tier2Label: "स्तर-२ मुख्य केन्द्र",
      clinicalPanel: "चिकित्सकीय वर्गीकरण एवं संकट चेतावनी",
      runEnrichment: "तत्काल संवर्धन चलाएँ",
      runningEnrichment: "संवर्धन प्रगति पर...",
      enrichmentDone: "संवर्धन चक्र पूर्ण हुआ।",
      enrichmentUnavailable: "संवर्धन सेवा अभी संयोजित नहीं है।",
      outbreakAlerts: "संक्रमण प्रकोप चेतावनी",
      shapTitle: "संकट कारक विश्लेषण (SHAP)",
      actionCards: "तत्काल कार्य पत्रक",
      eventLog: "जीवन्त कालक्रम घटना अभिलेख निरीक्षक",
      filterEvents: "घटना प्रकार चयन",
      allEvents: "समस्त घटनाएँ",
      colHlc: "कालक्रम मुहर",
      colOrigin: "उद्गम केन्द्र",
      colType: "घटना प्रकार",
      colPatient: "रोगी पहचान",
      colEnrichment: "संवर्धन स्थिति",
      colSummary: "विवरण",
      noPeers: "कोई संजाल सहकर्मी अभी संयोजित नहीं है।",
      noOutbreaks: "कोई सक्रिय संक्रमण प्रकोप चेतावनी नहीं है।",
      noShap: "अभी कोई संकट कारक संवर्धन उपलब्ध नहीं है।",
      noActionCards: "कोई सक्रिय कार्य पत्रक नहीं है।",
      noEvents: "अभिलेख में अभी कोई घटना नहीं है।",
      battery: "विद्युत स्तर",
      riskScore: "संकट सूचकांक",
      outbreakBannerPrefix: "सक्रिय संक्रमण प्रकोप चेतावनी",
    },
  };

  const state = {
    lang: "en",
    theme: "dark",
    autoRefresh: true,
    timerId: null,
    selectedEventType: "",
    lastSummary: null,
    lastPeers: [],
    lastConnectInfo: null,
    lastEvents: [],
  };

  function t(key) {
    return (I18N[state.lang] && I18N[state.lang][key]) || I18N.en[key] || key;
  }

  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (k === "className") {
          node.className = v;
        } else if (v !== null && v !== undefined) {
          node.setAttribute(k, String(v));
        }
      }
    }
    for (const child of children) {
      if (child === null || child === undefined) continue;
      if (typeof child === "string" || typeof child === "number") {
        node.appendChild(document.createTextNode(String(child)));
      } else {
        node.appendChild(child);
      }
    }
    return node;
  }

  function setText(id, value) {
    const node = document.getElementById(id);
    if (node) node.textContent = String(value);
  }

  function applyTranslations() {
    document.documentElement.lang = state.lang;
    setText("app-title", t("appTitle"));
    setText("app-subtitle", t("appSubtitle"));
    setText("badge-tier", t("badgeTier"));
    setText("badge-offline-text", t("badgeOffline"));
    setText("btn-lang", t("langToggle"));
    setText("btn-theme", state.theme === "dark" ? t("themeLight") : t("themeDark"));
    setText("btn-autorefresh", state.autoRefresh ? t("autoOn") : t("autoOff"));
    setText("btn-refresh", t("refresh"));

    const nodes = document.querySelectorAll("[data-i18n]");
    for (const node of nodes) {
      const key = node.getAttribute("data-i18n");
      if (key) node.textContent = t(key);
    }
  }

  function formatHlc(hlc) {
    if (!hlc) return "--";
    return `${hlc.wall_ms}:${hlc.logical}:${hlc.node_id}`;
  }

  function renderManifest(summary, connectInfo) {
    const manifest = summary && summary.manifest ? summary.manifest : null;
    if (manifest) {
      setText("manifest-node-id", manifest.node_id || "--");
      setText("manifest-ram", manifest.ram_mb ? `${manifest.ram_mb} MB` : "--");
      setText("manifest-cpu", manifest.cpu_cores || "--");
      setText("manifest-npu", manifest.has_npu ? t("npuAvailable") : t("npuAbsent"));
    }

    const httpUrl =
      (connectInfo && (connectInfo.http_url || connectInfo.base_url || connectInfo.lan_url)) ||
      window.location.origin;
    const wsUrl =
      (connectInfo && (connectInfo.ws_url || connectInfo.websocket_url)) ||
      `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws/mesh`;
    setText("connect-url", httpUrl);
    setText("connect-ws", wsUrl);
  }

  function renderKpis(summary) {
    if (!summary) return;
    const tc = summary.triage_counts || {};
    setText("kpi-patients", summary.patient_count ?? 0);
    setText("kpi-red", tc.RED_EMERGENCY ?? 0);
    setText("kpi-yellow", tc.YELLOW_PHC ?? 0);
    setText("kpi-green", tc.GREEN_HOME ?? 0);
    setText("kpi-pending", summary.pending_enrichments ?? 0);
    setText("kpi-completed", summary.completed_enrichments ?? 0);
    setText("kpi-events", summary.event_count ?? 0);
  }

  function renderPeers(peers) {
    const container = document.getElementById("peers-list");
    if (!container) return;

    const list = Array.isArray(peers) ? peers : [];
    setText("peer-count-badge", list.length);

    let tier0 = 0;
    let tier1 = 0;
    for (const p of list) {
      const tier = (p.manifest && p.manifest.tier) || p.tier || "";
      if (tier === "TIER_0_WATCH") tier0 += 1;
      if (tier === "TIER_1_PHONE") tier1 += 1;
    }
    setText("tier0-count", tier0);
    setText("tier1-count", tier1);

    if (list.length === 0) {
      container.replaceChildren(el("p", { className: "empty-state" }, t("noPeers")));
      return;
    }

    const cards = list.map((peer) => {
      const m = peer.manifest || peer;
      const nodeId = m.node_id || peer.node_id || "unknown-peer";
      const tier = m.tier || peer.tier || "PEER";
      const battery = m.battery_pct !== undefined ? `${t("battery")}: ${m.battery_pct}%` : "";
      const mode = m.watch_mode ? ` · ${m.watch_mode}` : "";
      const lastSeen = peer.last_seen_ms || peer.last_seen || "";
      const metaParts = [battery, mode, lastSeen ? `· ${lastSeen}` : ""].filter(Boolean).join(" ");

      return el(
        "div",
        { className: "item-card" },
        el(
          "div",
          { className: "item-card-head" },
          el("span", { className: "item-card-title mono" }, nodeId),
          el("span", { className: "badge badge-accent" }, tier)
        ),
        metaParts ? el("div", { className: "item-card-meta" }, metaParts) : null
      );
    });
    container.replaceChildren(...cards);
  }

  function renderOutbreaks(alerts) {
    const banner = document.getElementById("outbreak-banner");
    const container = document.getElementById("outbreak-list");
    const list = Array.isArray(alerts) ? alerts : [];

    if (banner) {
      if (list.length > 0) {
        const latest = list[list.length - 1];
        const p = latest.payload || {};
        const detail = p.message || p.syndrome || p.village_id || latest.event_id;
        banner.classList.remove("hidden");
        banner.replaceChildren(
          el("strong", null, `${t("outbreakBannerPrefix")}: ${detail}`),
          el("span", { className: "badge badge-red" }, String(list.length))
        );
      } else {
        banner.classList.add("hidden");
        banner.replaceChildren();
      }
    }

    if (!container) return;
    if (list.length === 0) {
      container.replaceChildren(el("p", { className: "empty-state" }, t("noOutbreaks")));
      return;
    }

    const cards = list.map((alert) => {
      const p = alert.payload || {};
      const title = p.syndrome || p.disease || p.title || alert.event_type;
      const village = p.village_id ? `Village: ${p.village_id}` : "";
      const detail = p.message || p.rationale || JSON.stringify(p);
      return el(
        "div",
        { className: "item-card" },
        el(
          "div",
          { className: "item-card-head" },
          el("span", { className: "item-card-title" }, title),
          el("span", { className: "badge badge-red" }, village || "EWMA")
        ),
        el("div", { className: "item-card-meta" }, detail)
      );
    });
    container.replaceChildren(...cards);
  }

  function normalizeShapEntries(raw) {
    if (Array.isArray(raw)) {
      return raw
        .map((item) => {
          if (item && typeof item === "object") {
            const name = item.feature || item.name || "feature";
            const value = Number(item.contribution ?? item.value ?? item.shap ?? 0);
            return { name: String(name), value: Number.isFinite(value) ? value : 0 };
          }
          return null;
        })
        .filter(Boolean);
    }
    if (raw && typeof raw === "object") {
      return Object.entries(raw).map(([name, val]) => ({
        name,
        value: Number.isFinite(Number(val)) ? Number(val) : 0,
      }));
    }
    return [];
  }

  function renderShap(enrichments) {
    const container = document.getElementById("shap-list");
    if (!container) return;

    const list = Array.isArray(enrichments) ? enrichments : [];
    if (list.length === 0) {
      container.replaceChildren(el("p", { className: "empty-state" }, t("noShap")));
      return;
    }

    const cards = list.slice(0, 6).map((item) => {
      const entries = normalizeShapEntries(item.shap_attributions);
      const maxAbs = Math.max(
        0.01,
        ...entries.map((entry) => Math.abs(entry.value))
      );
      const scoreText =
        item.risk_score !== null && item.risk_score !== undefined
          ? `${t("riskScore")}: ${Number(item.risk_score).toFixed(2)}`
          : item.risk_band || "ENRICHED";

      const barNodes = entries.slice(0, 5).map((entry) => {
        const pct = Math.min(100, Math.round((Math.abs(entry.value) / maxAbs) * 100));
        const fillClass = entry.value >= 0 ? "shap-fill-pos" : "shap-fill-neg";
        const fill = el("div", { className: fillClass });
        fill.style.width = `${pct}%`;
        return el(
          "div",
          { className: "shap-bar-row" },
          el("span", { className: "mono" }, entry.name),
          el("div", { className: "shap-track" }, fill),
          el("span", { className: "mono" }, (entry.value >= 0 ? "+" : "") + entry.value.toFixed(2))
        );
      });

      return el(
        "div",
        { className: "item-card" },
        el(
          "div",
          { className: "item-card-head" },
          el("span", { className: "item-card-title mono" }, item.patient_id || item.ref_event_id || item.event_id),
          el("span", { className: "badge badge-yellow" }, scoreText)
        ),
        item.summary ? el("div", { className: "item-card-meta" }, item.summary) : null,
        ...barNodes
      );
    });
    container.replaceChildren(...cards);
  }

  function renderActionCards(cardsData) {
    const container = document.getElementById("action-cards-list");
    if (!container) return;

    const list = Array.isArray(cardsData) ? cardsData : [];
    if (list.length === 0) {
      container.replaceChildren(el("p", { className: "empty-state" }, t("noActionCards")));
      return;
    }

    const cards = list.map((card) => {
      const priority = card.priority || "MEDIUM";
      const badgeClass =
        priority === "CRITICAL"
          ? "badge badge-red"
          : priority === "HIGH"
            ? "badge badge-yellow"
            : "badge badge-green";

      return el(
        "div",
        { className: "item-card" },
        el(
          "div",
          { className: "item-card-head" },
          el("span", { className: "item-card-title" }, card.title || card.card_id),
          el("span", { className: badgeClass }, `${priority} · ${card.status || "OPEN"}`)
        ),
        el("div", { className: "item-card-meta" }, card.summary || ""),
        card.patient_id
          ? el("div", { className: "item-card-meta mono" }, `${card.patient_id} · ${card.target_tier || ""}`)
          : null
      );
    });
    container.replaceChildren(...cards);
  }

  function renderEvents(events) {
    const tbody = document.getElementById("events-tbody");
    if (!tbody) return;

    const list = Array.isArray(events) ? events : [];
    if (list.length === 0) {
      const emptyRow = el(
        "tr",
        null,
        el("td", { colspan: "6", className: "empty-state" }, t("noEvents"))
      );
      tbody.replaceChildren(emptyRow);
      return;
    }

    const rows = list.map((evt) => {
      const payloadStr = JSON.stringify(evt.payload || {});
      return el(
        "tr",
        null,
        el("td", { className: "mono" }, formatHlc(evt.hlc)),
        el("td", { className: "mono" }, evt.origin_node_id || "--"),
        el("td", null, el("span", { className: "badge badge-accent" }, evt.event_type)),
        el("td", { className: "mono" }, evt.patient_id || "--"),
        el("td", null, el("span", { className: "badge" }, evt.enrichment_state || "NOT_NEEDED")),
        el("td", { className: "payload-cell mono", title: payloadStr }, payloadStr)
      );
    });
    tbody.replaceChildren(...rows);
  }

  async function fetchJsonSafe(url) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return null;
      return await res.json();
    } catch (_err) {
      return null;
    }
  }

  async function refreshAll() {
    const eventsQuery = state.selectedEventType
      ? `/api/v1/events?limit=50&event_type=${encodeURIComponent(state.selectedEventType)}`
      : "/api/v1/events?limit=50";

    const [summary, peersResp, connectInfo, events] = await Promise.all([
      fetchJsonSafe("/api/v1/dashboard/summary"),
      fetchJsonSafe("/api/v1/peers"),
      fetchJsonSafe("/api/v1/discovery/connect-info"),
      fetchJsonSafe(eventsQuery),
    ]);

    if (summary) state.lastSummary = summary;
    if (peersResp !== null) {
      state.lastPeers = Array.isArray(peersResp) ? peersResp : peersResp.peers || [];
    } else if (summary && Array.isArray(summary.peers)) {
      state.lastPeers = summary.peers;
    }
    if (connectInfo) state.lastConnectInfo = connectInfo;
    if (Array.isArray(events)) state.lastEvents = events;

    renderAll();
    setText("last-updated", new Date().toLocaleTimeString());
  }

  function renderAll() {
    applyTranslations();
    renderManifest(state.lastSummary, state.lastConnectInfo);
    renderKpis(state.lastSummary);
    renderPeers(state.lastPeers);
    renderOutbreaks(state.lastSummary ? state.lastSummary.outbreak_alerts : []);
    renderShap(state.lastSummary ? state.lastSummary.enrichments : []);
    renderActionCards(state.lastSummary ? state.lastSummary.action_cards : []);
    renderEvents(state.lastEvents);
  }

  async function triggerEnrichment() {
    const btn = document.getElementById("btn-run-enrichment");
    const status = document.getElementById("enrichment-status");
    if (btn) {
      btn.disabled = true;
      btn.textContent = t("runningEnrichment");
    }
    try {
      let res = await fetch("/api/v1/enrichment/run", { method: "POST" });
      if (res.status === 404) {
        res = await fetch("/api/v1/enrichment/run-once", { method: "POST" });
      }
      if (status) {
        status.classList.remove("hidden");
        status.textContent = res.ok ? t("enrichmentDone") : t("enrichmentUnavailable");
      }
      await refreshAll();
    } catch (_err) {
      if (status) {
        status.classList.remove("hidden");
        status.textContent = t("enrichmentUnavailable");
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = t("runEnrichment");
      }
    }
  }

  function syncAutoRefreshTimer() {
    if (state.timerId !== null) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
    if (state.autoRefresh) {
      state.timerId = setInterval(refreshAll, 5000);
    }
  }

  function bindEvents() {
    const langBtn = document.getElementById("btn-lang");
    if (langBtn) {
      langBtn.addEventListener("click", () => {
        state.lang = state.lang === "en" ? "hi" : "en";
        renderAll();
      });
    }

    const themeBtn = document.getElementById("btn-theme");
    if (themeBtn) {
      themeBtn.addEventListener("click", () => {
        state.theme = state.theme === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", state.theme);
        applyTranslations();
      });
    }

    const autoBtn = document.getElementById("btn-autorefresh");
    if (autoBtn) {
      autoBtn.addEventListener("click", () => {
        state.autoRefresh = !state.autoRefresh;
        autoBtn.classList.toggle("active", state.autoRefresh);
        autoBtn.setAttribute("aria-pressed", String(state.autoRefresh));
        applyTranslations();
        syncAutoRefreshTimer();
      });
    }

    const refreshBtn = document.getElementById("btn-refresh");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => {
        refreshAll();
      });
    }

    const enrichBtn = document.getElementById("btn-run-enrichment");
    if (enrichBtn) {
      enrichBtn.addEventListener("click", () => {
        triggerEnrichment();
      });
    }

    const filterSelect = document.getElementById("event-type-filter");
    if (filterSelect) {
      filterSelect.addEventListener("change", (ev) => {
        state.selectedEventType = ev.target.value || "";
        refreshAll();
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    bindEvents();
    applyTranslations();
    refreshAll();
    syncAutoRefreshTimer();
  });
})();
