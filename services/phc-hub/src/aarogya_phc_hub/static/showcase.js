(() => {
  "use strict";

  const I18N = {
    en: {
      stageTitle: "Aarogya Mesh — 3-Tier Live Stage",
      stageSubtitle: "Watch ↔ Phone ↔ PHC Hub · Live CRDT Telemetry Every 2s",
      scMaternal: "1. Maternal Watch SOS",
      scVoice: "2. Offline Voice → AI",
      scOutbreak: "3. Village Outbreak",
      scCrdt: "4. CRDT Merge Proof",
      scReset: "Reset",
      runEnrichment: "Run Hub Enrichment",
      runningEnrichment: "Running...",
      badgeOffline: "AIRPLANE-MODE SAFE",
      langToggle: "हिन्दी",
      backToHub: "← Command Center",
      syncIdle: "LIVE SYNC READY",
      syncPulse: "CRDT SYNC PULSE",
      defaultNarrative:
        "Tap a danger sign on the Watch, register a patient on the Phone, or launch a 1-click clinical scenario above.",
      scenarioRunning: "Executing live clinical scenario through Hub CRDT engine...",
      scenarioDonePrefix: "Active Scenario:",
      resetDone: "Hub state cleared. Ready for live Watch/Phone interaction or scenario playback.",
      enrichmentDone: "Hub AI enrichment completed — SHAP scores & Action Cards updated.",
      endpointUnavailable: "Endpoint unavailable.",
      colWatchTitle: "Watch Companion",
      colWatchSub: "Normal Person / Patient-Family & CHW",
      colPhoneTitle: "ASHA Field Phone",
      colPhoneSub: "Offline WHO IMNCI + IndexedDB + CRDT Sync",
      colHubTitle: "PHC Clinical Intelligence",
      colHubSub: "Whisper + SLM + LightGBM SHAP + EWMA Outbreak",
      watchCap1: "Standalone SOS",
      watchCap2: "1-Tap Danger Signs",
      watchCap3: "Action Card Alerts",
      phoneCap1: "Deterministic IMNCI",
      phoneCap2: "Offline Voice Queue",
      phoneCap3: "HLC Delta Sync",
      kpiPatients: "Patients",
      kpiRed: "RED",
      kpiYellow: "YELLOW",
      kpiGreen: "GREEN",
      kpiPending: "Pending AI",
      hubPeersTitle: "Live Synced Peers",
      hubTriageTitle: "Real-Time Triage Alerts",
      hubShapTitle: "SHAP Risk Attributions",
      hubActionsTitle: "Action Cards → Watch & Phone",
      hubEventsTitle: "Latest CRDT Sync Stream",
      noPeers: "No peers synced yet. Tap Sync on Watch/Phone or pick a scenario.",
      noTriage: "No triage alerts yet.",
      noShap: "No SHAP risk attributions yet.",
      noActions: "No Action Cards issued yet.",
      noEvents: "Waiting for CRDT events...",
      outbreakPrefix: "EWMA OUTBREAK",
      riskLabel: "Risk",
      eventsUnit: "events",
    },
    hi: {
      stageTitle: "आरोग्य संजाल — त्रि-स्तरीय जीवन्त मंच",
      stageSubtitle: "घटिका ↔ दूरभाष ↔ मुख्य केन्द्र · प्रत्येक २ क्षण जीवन्त समन्वय",
      scMaternal: "१. मातृ घटिका आपात",
      scVoice: "२. स्वर → प्रज्ञा संवर्धन",
      scOutbreak: "३. ग्राम संक्रमण प्रकोप",
      scCrdt: "४. द्वन्द्व-रहित विलय",
      scReset: "पुनःस्थापन",
      runEnrichment: "संवर्धन चलाएँ",
      runningEnrichment: "प्रगति पर...",
      badgeOffline: "अन्तर्जाल-रहित सुरक्षित",
      langToggle: "English",
      backToHub: "← नियन्त्रण कक्ष",
      syncIdle: "जीवन्त समन्वय तत्पर",
      syncPulse: "नवीन समन्वय स्पन्दन",
      defaultNarrative:
        "घटिका पर आपात लक्षण चुनें, दूरभाष में रोगी पंजीकृत करें अथवा ऊपर से परिदृश्य प्रारम्भ करें।",
      scenarioRunning: "वास्तविक चिकित्सकीय परिदृश्य प्रारम्भ हो रहा है...",
      scenarioDonePrefix: "सक्रिय परिदृश्य:",
      resetDone: "मुख्य केन्द्र स्वच्छ हुआ। जीवन्त प्रदर्शन हेतु तत्पर।",
      enrichmentDone: "मुख्य केन्द्र संवर्धन पूर्ण — संकट सूचकांक एवं कार्य पत्रक अद्यतन।",
      endpointUnavailable: "सेवा अभी संयोजित नहीं है।",
      colWatchTitle: "घटिका सहचर",
      colWatchSub: "सामान्य जन / परिवार एवं स्वास्थ्य कार्यकर्ता",
      colPhoneTitle: "आशा क्षेत्र दूरभाष",
      colPhoneSub: "अन्तर्जाल-रहित वर्गीकरण एवं स्थानीय संग्रहण",
      colHubTitle: "प्राथमिक स्वास्थ्य केन्द्र प्रज्ञा",
      colHubSub: "ध्वनि अनुलेखन · संकट कारक विश्लेषण · प्रकोप संसूचन",
      watchCap1: "स्वावलम्बी आपात संकेत",
      watchCap2: "एक-स्पर्श संकट लक्षण",
      watchCap3: "कार्य पत्रक सूचना",
      phoneCap1: "निश्चित नियम वर्गीकरण",
      phoneCap2: "अन्तर्जाल-रहित स्वर पंक्ति",
      phoneCap3: "कालक्रम समन्वय",
      kpiPatients: "रोगी",
      kpiRed: "रक्त",
      kpiYellow: "पीत",
      kpiGreen: "हरित",
      kpiPending: "प्रतीक्षारत",
      hubPeersTitle: "जीवन्त समन्वित सहकर्मी",
      hubTriageTitle: "तत्काल चिकित्सकीय वर्गीकरण",
      hubShapTitle: "संकट कारक विश्लेषण (SHAP)",
      hubActionsTitle: "कार्य पत्रक → घटिका एवं दूरभाष",
      hubEventsTitle: "नवीनतम घटना प्रवाह",
      noPeers: "अभी कोई सहकर्मी संयोजित नहीं है।",
      noTriage: "अभी कोई चिकित्सकीय वर्गीकरण नहीं है।",
      noShap: "अभी कोई संकट कारक विश्लेषण उपलब्ध नहीं है।",
      noActions: "अभी कोई कार्य पत्रक जारी नहीं हुआ है।",
      noEvents: "घटनाओं की प्रतीक्षा...",
      outbreakPrefix: "संक्रमण प्रकोप चेतावनी",
      riskLabel: "संकट",
      eventsUnit: "घटनाएँ",
    },
  };

  const state = {
    lang: "en",
    activeScenario: null,
    lastEventCount: -1,
    lastHlcKey: "",
    pulseTimer: null,
    lastSummary: null,
    lastPeers: [],
    lastEvents: [],
    customNarrative: null,
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

  function formatHlc(hlc) {
    if (!hlc) return "--";
    return `${hlc.wall_ms}:${hlc.logical}:${hlc.node_id}`;
  }

  function applyTranslations() {
    document.documentElement.lang = state.lang;
    setText("stage-title", t("stageTitle"));
    setText("stage-subtitle", t("stageSubtitle"));
    setText("btn-stage-lang", t("langToggle"));
    const nodes = document.querySelectorAll("[data-i18n]");
    for (const node of nodes) {
      const key = node.getAttribute("data-i18n");
      if (key) node.textContent = t(key);
    }
    if (state.customNarrative) {
      setText("narrative-text", state.customNarrative);
    }
  }

  function triggerSyncPulse() {
    const pill = document.getElementById("sync-pulse-pill");
    const hub = document.getElementById("hub-brain-panel");
    setText("sync-pulse-label", t("syncPulse"));
    if (pill) pill.classList.add("sync-pulsing");
    if (hub) hub.classList.add("hub-synced");

    if (state.pulseTimer !== null) clearTimeout(state.pulseTimer);
    state.pulseTimer = setTimeout(() => {
      if (pill) pill.classList.remove("sync-pulsing");
      if (hub) hub.classList.remove("hub-synced");
      setText("sync-pulse-label", t("syncIdle"));
    }, 1600);
  }

  function normalizeShap(raw) {
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

  function renderHubBrain() {
    const summary = state.lastSummary;
    const peers = state.lastPeers;
    const events = state.lastEvents;

    if (summary) {
      const tc = summary.triage_counts || {};
      setText("hub-kpi-patients", summary.patient_count ?? 0);
      setText("hub-kpi-red", tc.RED_EMERGENCY ?? 0);
      setText("hub-kpi-yellow", tc.YELLOW_PHC ?? 0);
      setText("hub-kpi-green", tc.GREEN_HOME ?? 0);
      setText("hub-kpi-pending", summary.pending_enrichments ?? 0);
      setText("stage-metric-events", `${summary.event_count ?? 0} ${t("eventsUnit")}`);
      setText("stage-metric-hlc", summary.latest_hlc ? `HLC ${formatHlc(summary.latest_hlc)}` : "HLC --");

      // Outbreak Banner
      const ob = document.getElementById("hub-outbreak-banner");
      const alerts = Array.isArray(summary.outbreak_alerts) ? summary.outbreak_alerts : [];
      if (ob) {
        if (alerts.length > 0) {
          const latest = alerts[alerts.length - 1];
          const p = latest.payload || {};
          const detail = p.message || p.syndrome || p.village_id || latest.event_id;
          ob.classList.remove("hidden");
          ob.replaceChildren(
            el("strong", null, `${t("outbreakPrefix")}: ${detail}`),
            el("span", { className: "badge badge-red" }, String(alerts.length))
          );
        } else {
          ob.classList.add("hidden");
          ob.replaceChildren();
        }
      }

      // Real-time Triage Alerts
      const triageContainer = document.getElementById("hub-triage-list");
      const history = Array.isArray(summary.triage_history) ? summary.triage_history : [];
      const enrTriages = [];
      if (Array.isArray(summary.enrichments)) {
        for (const enr of summary.enrichments) {
          const ta = enr && enr.payload && enr.payload.triage_assessment;
          if (ta && typeof ta === "object" && ta.severity) enrTriages.push(ta);
        }
      }
      const triages = [...history, ...enrTriages].reverse();
      setText("hub-triage-count", triages.length);
      if (triageContainer) {
        if (triages.length === 0) {
          triageContainer.replaceChildren(el("p", { className: "empty-state" }, t("noTriage")));
        } else {
          const cards = triages.slice(0, 4).map((item) => {
            const sev = item.severity || "GREEN_HOME";
            const badgeCls =
              sev === "RED_EMERGENCY"
                ? "badge badge-red"
                : sev === "YELLOW_PHC"
                  ? "badge badge-yellow"
                  : "badge badge-green";
            const cardCls =
              sev === "RED_EMERGENCY"
                ? "hub-card hub-card-red"
                : sev === "YELLOW_PHC"
                  ? "hub-card hub-card-yellow"
                  : "hub-card hub-card-green";
            return el(
              "div",
              { className: cardCls },
              el(
                "div",
                { className: "hub-card-head" },
                el("span", { className: "hub-card-title mono" }, item.patient_id || item.assessment_id),
                el("span", { className: badgeCls }, sev)
              ),
              item.rationale ? el("div", { className: "hub-card-meta" }, item.rationale) : null
            );
          });
          triageContainer.replaceChildren(...cards);
        }
      }

      // SHAP Bars
      const shapContainer = document.getElementById("hub-shap-list");
      const enrichments = Array.isArray(summary.enrichments) ? summary.enrichments : [];
      setText("hub-shap-count", enrichments.length);
      if (shapContainer) {
        if (enrichments.length === 0) {
          shapContainer.replaceChildren(el("p", { className: "empty-state" }, t("noShap")));
        } else {
          const cards = enrichments.slice(0, 3).map((item) => {
            const entries = normalizeShap(item.shap_attributions);
            const maxAbs = Math.max(0.01, ...entries.map((e) => Math.abs(e.value)));
            const scoreText =
              item.risk_score !== null && item.risk_score !== undefined
                ? `${t("riskLabel")}: ${Number(item.risk_score).toFixed(2)}`
                : item.risk_band || "ENRICHED";

            const rows = entries.slice(0, 4).map((entry) => {
              const pct = Math.min(100, Math.round((Math.abs(entry.value) / maxAbs) * 100));
              const fill = el("div", { className: entry.value >= 0 ? "shap-fill-pos" : "shap-fill-neg" });
              fill.style.width = `${pct}%`;
              return el(
                "div",
                { className: "shap-row" },
                el("span", { className: "mono shap-name", title: entry.name }, entry.name),
                el("div", { className: "shap-track" }, fill),
                el("span", { className: "mono shap-num" }, (entry.value >= 0 ? "+" : "") + entry.value.toFixed(2))
              );
            });

            return el(
              "div",
              { className: "hub-card" },
              el(
                "div",
                { className: "hub-card-head" },
                el("span", { className: "hub-card-title mono" }, item.patient_id || item.event_id),
                el("span", { className: "badge badge-yellow" }, scoreText)
              ),
              item.summary ? el("div", { className: "hub-card-meta" }, item.summary) : null,
              ...rows
            );
          });
          shapContainer.replaceChildren(...cards);
        }
      }

      // Action Cards
      const actContainer = document.getElementById("hub-actions-list");
      const actionCards = Array.isArray(summary.action_cards) ? summary.action_cards : [];
      setText("hub-actions-count", actionCards.length);
      if (actContainer) {
        if (actionCards.length === 0) {
          actContainer.replaceChildren(el("p", { className: "empty-state" }, t("noActions")));
        } else {
          const cards = actionCards.slice(0, 4).map((card) => {
            const prio = card.priority || "MEDIUM";
            const badgeCls =
              prio === "CRITICAL"
                ? "badge badge-red"
                : prio === "HIGH"
                  ? "badge badge-yellow"
                  : "badge badge-green";
            const cardCls =
              prio === "CRITICAL"
                ? "hub-card hub-card-red"
                : prio === "HIGH"
                  ? "hub-card hub-card-yellow"
                  : "hub-card hub-card-green";
            return el(
              "div",
              { className: cardCls },
              el(
                "div",
                { className: "hub-card-head" },
                el("span", { className: "hub-card-title" }, card.title || card.card_id),
                el("span", { className: badgeCls }, prio)
              ),
              card.summary ? el("div", { className: "hub-card-meta" }, card.summary) : null,
              el(
                "div",
                { className: "hub-card-meta mono" },
                `${card.patient_id || "--"} → ${card.target_tier || "MESH"}`
              )
            );
          });
          actContainer.replaceChildren(...cards);
        }
      }
    }

    // Peers
    const peersContainer = document.getElementById("hub-peers-list");
    const peerList = Array.isArray(peers) ? peers : [];
    let watchCount = 0;
    let phoneCount = 0;
    for (const p of peerList) {
      const tier = (p.manifest && p.manifest.tier) || p.tier || "";
      if (tier === "TIER_0_WATCH") watchCount += 1;
      if (tier === "TIER_1_PHONE") phoneCount += 1;
    }
    setText("watch-peer-badge", watchCount);
    setText("phone-peer-badge", phoneCount);
    setText("hub-peers-count", peerList.length);

    if (peersContainer) {
      if (peerList.length === 0) {
        peersContainer.replaceChildren(el("p", { className: "empty-state" }, t("noPeers")));
      } else {
        const chips = peerList.map((p) => {
          const m = p.manifest || p;
          const nodeId = m.node_id || p.node_id || "peer";
          const tier = m.tier || p.tier || "";
          const mode = m.watch_mode ? ` · ${m.watch_mode}` : "";
          return el(
            "span",
            { className: "peer-chip mono" },
            el("span", { className: "peer-chip-dot", "aria-hidden": "true" }),
            el("span", null, `${nodeId}${mode}`),
            el("span", { className: "badge badge-accent" }, tier.replace("TIER_", "T"))
          );
        });
        peersContainer.replaceChildren(...chips);
      }
    }

    // Compact CRDT Sync Stream
    const eventsContainer = document.getElementById("hub-events-list");
    const evList = Array.isArray(events) ? events : [];
    setText("hub-events-count", summary ? summary.event_count ?? evList.length : evList.length);
    if (eventsContainer) {
      if (evList.length === 0) {
        eventsContainer.replaceChildren(el("p", { className: "empty-state" }, t("noEvents")));
      } else {
        const rows = evList.slice(0, 5).map((evt) =>
          el(
            "div",
            { className: "stream-row mono" },
            el("span", { className: "stream-origin" }, evt.origin_node_id || "--"),
            el("span", { className: "badge badge-accent" }, evt.event_type)
          )
        );
        eventsContainer.replaceChildren(...rows);
      }
    }
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

  async function pollHub() {
    const [summary, peersResp, events] = await Promise.all([
      fetchJsonSafe("/api/v1/dashboard/summary"),
      fetchJsonSafe("/api/v1/peers"),
      fetchJsonSafe("/api/v1/events?limit=8"),
    ]);

    if (summary) {
      const nextCount = summary.event_count ?? 0;
      const nextHlc = summary.latest_hlc ? formatHlc(summary.latest_hlc) : "";
      if (
        state.lastEventCount !== -1 &&
        (nextCount !== state.lastEventCount || nextHlc !== state.lastHlcKey)
      ) {
        triggerSyncPulse();
      }
      state.lastEventCount = nextCount;
      state.lastHlcKey = nextHlc;
      state.lastSummary = summary;
    }

    if (peersResp !== null) {
      state.lastPeers = Array.isArray(peersResp) ? peersResp : peersResp.peers || [];
    } else if (summary && Array.isArray(summary.peers)) {
      state.lastPeers = summary.peers;
    }

    if (Array.isArray(events)) {
      state.lastEvents = events;
    }

    renderHubBrain();
    setText("hub-last-tick", new Date().toLocaleTimeString());
  }

  function updateScenarioPills() {
    const pills = document.querySelectorAll("[data-scenario]");
    for (const pill of pills) {
      pill.classList.toggle("active", pill.getAttribute("data-scenario") === state.activeScenario);
    }
  }

  async function runScenario(scenarioId) {
    const controls = document.querySelectorAll("[data-scenario], #btn-stage-reset");
    for (const c of controls) c.disabled = true;
    state.customNarrative = t("scenarioRunning");
    setText("narrative-text", state.customNarrative);

    try {
      const res = await fetch(`/api/v1/demo/load/${encodeURIComponent(scenarioId)}`, {
        method: "POST",
      });
      if (!res.ok) {
        state.customNarrative = t("endpointUnavailable");
        setText("narrative-text", state.customNarrative);
        return;
      }
      const data = await res.json();
      state.activeScenario = scenarioId;
      updateScenarioPills();
      state.customNarrative = `${t("scenarioDonePrefix")} ${scenarioId} (${data.events_added ?? 0} ${t("eventsUnit")}, ${data.patient_count ?? 0} ${t("kpiPatients")})`;
      setText("narrative-text", state.customNarrative);
      triggerSyncPulse();
      await pollHub();
    } catch (_err) {
      state.customNarrative = t("endpointUnavailable");
      setText("narrative-text", state.customNarrative);
    } finally {
      for (const c of controls) c.disabled = false;
    }
  }

  async function resetStage() {
    const controls = document.querySelectorAll("[data-scenario], #btn-stage-reset");
    for (const c of controls) c.disabled = true;
    try {
      const res = await fetch("/api/v1/demo/reset", { method: "POST" });
      if (!res.ok) {
        state.customNarrative = t("endpointUnavailable");
        setText("narrative-text", state.customNarrative);
        return;
      }
      state.activeScenario = null;
      updateScenarioPills();
      state.customNarrative = t("resetDone");
      setText("narrative-text", state.customNarrative);
      await pollHub();
    } catch (_err) {
      state.customNarrative = t("endpointUnavailable");
      setText("narrative-text", state.customNarrative);
    } finally {
      for (const c of controls) c.disabled = false;
    }
  }

  async function runEnrichment() {
    const btn = document.getElementById("btn-stage-enrich");
    if (btn) {
      btn.disabled = true;
      btn.textContent = t("runningEnrichment");
    }
    try {
      let res = await fetch("/api/v1/enrichment/run", { method: "POST" });
      if (res.status === 404) {
        res = await fetch("/api/v1/enrichment/run-once", { method: "POST" });
      }
      state.customNarrative = res.ok ? t("enrichmentDone") : t("endpointUnavailable");
      setText("narrative-text", state.customNarrative);
      if (res.ok) triggerSyncPulse();
      await pollHub();
    } catch (_err) {
      state.customNarrative = t("endpointUnavailable");
      setText("narrative-text", state.customNarrative);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = t("runEnrichment");
      }
    }
  }

  function bindEvents() {
    const langBtn = document.getElementById("btn-stage-lang");
    if (langBtn) {
      langBtn.addEventListener("click", () => {
        state.lang = state.lang === "en" ? "hi" : "en";
        state.customNarrative = null;
        applyTranslations();
        renderHubBrain();
      });
    }

    const scenarioBtns = document.querySelectorAll("[data-scenario]");
    for (const btn of scenarioBtns) {
      btn.addEventListener("click", () => {
        const sid = btn.getAttribute("data-scenario");
        if (sid) runScenario(sid);
      });
    }

    const resetBtn = document.getElementById("btn-stage-reset");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        resetStage();
      });
    }

    const enrichBtn = document.getElementById("btn-stage-enrich");
    if (enrichBtn) {
      enrichBtn.addEventListener("click", () => {
        runEnrichment();
      });
    }

    const reloadWatch = document.getElementById("btn-reload-watch");
    if (reloadWatch) {
      reloadWatch.addEventListener("click", () => {
        const frame = document.getElementById("iframe-watch");
        if (frame) frame.setAttribute("src", "/watch/");
      });
    }

    const reloadPhone = document.getElementById("btn-reload-phone");
    if (reloadPhone) {
      reloadPhone.addEventListener("click", () => {
        const frame = document.getElementById("iframe-phone");
        if (frame) frame.setAttribute("src", "/phone/");
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    bindEvents();
    applyTranslations();
    pollHub();
    setInterval(pollHub, 2000);
  });
})();
