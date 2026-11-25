(() => {
  "use strict";

  const STORAGE_THEME_KEY = "aarogya.theme";
  const STORAGE_LANG_KEY = "aarogya.lang";

  const I18N = {
    en: {
      stageTitle: "Aarogya Mesh — 3-Tier Stage",
      stageSubtitle: "Watch ↔ Phone ↔ Hub · Live 2s Sync",
      scMaternal: "1. Watch SOS",
      scVoice: "2. Voice → AI",
      scOutbreak: "3. Outbreak",
      scCrdt: "4. CRDT Merge",
      scMaternalTitle: "Maternal Watch SOS → ASHA Phone",
      scVoiceTitle: "Offline Voice Note → Hub AI Enrichment",
      scOutbreakTitle: "Multi-Worker EWMA Village Outbreak",
      scCrdtTitle: "Offline Conflict-Free CRDT Merge",
      scReset: "Reset",
      runEnrichment: "Run AI",
      runningEnrichment: "Running...",
      badgeOffline: "OFFLINE SAFE",
      themeLight: "Light",
      themeDark: "Dark",
      langToggle: "हिन्दी",
      backToHub: "← Hub",
      syncIdle: "LIVE SYNC READY",
      syncPulse: "CRDT SYNC PULSE",
      defaultNarrative:
        "Tap a danger sign on Watch, register a patient on Phone, or run a 1-click clinical scenario above.",
      scenarioRunning: "Executing live clinical scenario through Hub CRDT engine...",
      scenarioDonePrefix: "Active:",
      resetDone: "Hub state cleared. Ready for live Watch/Phone interaction or scenario playback.",
      enrichmentDone: "Hub AI enrichment completed — SHAP scores & Action Cards updated.",
      endpointUnavailable: "Endpoint unavailable.",
      colWatchTitle: "Watch Companion",
      colWatchSub: "Patient-Family & CHW",
      colPhoneTitle: "ASHA Field Phone",
      colPhoneSub: "WHO IMNCI + Offline IndexedDB",
      colHubTitle: "PHC Clinical Intelligence",
      colHubSub: "Whisper + SLM + LightGBM SHAP + EWMA",
      watchCap1: "Standalone SOS",
      watchCap2: "1-Tap Danger Signs",
      watchCap3: "Action Alerts",
      phoneCap1: "WHO IMNCI",
      phoneCap2: "Voice Queue",
      phoneCap3: "HLC Sync",
      kpiPatients: "Patients",
      kpiRed: "RED",
      kpiYellow: "YELLOW",
      kpiGreen: "GREEN",
      kpiPending: "Pending AI",
      hubPeersTitle: "Peers",
      tabAlerts: "Alerts & Cards",
      tabShap: "SHAP & Triage",
      tabStream: "CRDT Stream",
      hubActionsTitle: "Action Cards → Watch & Phone",
      hubOutbreaksTitle: "EWMA Outbreak Alerts",
      hubShapTitle: "SHAP Risk Attributions",
      hubTriageTitle: "Real-Time Triage Decisions",
      hubEventsTitle: "Latest CRDT Sync Stream",
      noPeers: "No peers synced yet.",
      noTriage: "No triage decisions yet.",
      noShap: "No SHAP risk attributions yet.",
      noActions: "No Action Cards issued yet.",
      noOutbreaks: "No active EWMA outbreak alerts.",
      noEvents: "Waiting for CRDT events...",
      outbreakPrefix: "EWMA OUTBREAK",
      riskLabel: "Risk",
      eventsUnit: "events",
      moreItems: "+{n} more",
      peerWatchFamily: "Watch · Family",
      peerWatchChw: "Watch · CHW",
      peerPhoneAsha: "Phone · ASHA",
      peerHub: "PHC Hub",
      targetWatch: "Watch",
      targetPhone: "Phone",
      targetMesh: "Mesh",
      sevRed: "RED EMERGENCY",
      sevYellow: "YELLOW PHC",
      sevGreen: "GREEN HOME",
      prioCritical: "CRITICAL",
      prioHigh: "HIGH",
      prioMedium: "MEDIUM",
      prioLow: "LOW",
      proofCloudRpcs: "0 Cloud RPCs",
      proofSafetyFloor: "WHO Safety Floor · conf=1.00",
      proofZeroBloat: "0 PyTorch · 0 CUDA",
      convergedPatientsUnit: "converged patients",
      hubCrdtMergeTitle: "CRDT LWW Conflict-Free Merge Proof",
      zeroDataLoss: "0 data loss",
      simultaneousTieBreak: "Same wall_ms HLC tie-break",
      convergedRecord: "Converged LWW PatientRecord",
      stageAudio: "Audio Blob",
      stageAsr: "ASR",
      stageSlm: "GBNF SLM",
      stageTriage: "WHO Rule (1.00)",
      stageShap: "TreeSHAP",
      symptomsLabel: "Symptoms",
      dangerFlagsLabel: "Danger Flags",
      shapPosLegend: "+ Risk-driving",
      shapNegLegend: "- Protective",
    },
    hi: {
      stageTitle: "आरोग्य संजाल — त्रि-स्तरीय मंच",
      stageSubtitle: "घटिका ↔ दूरभाष ↔ मुख्य केन्द्र · २ क्षण समन्वय",
      scMaternal: "१. घटिका आपात",
      scVoice: "२. स्वर → प्रज्ञा",
      scOutbreak: "३. ग्राम प्रकोप",
      scCrdt: "४. द्वन्द्व-रहित विलय",
      scMaternalTitle: "मातृ घटिका आपात संकेत → आशा दूरभाष",
      scVoiceTitle: "अन्तर्जाल-रहित स्वर → मुख्य केन्द्र प्रज्ञा संवर्धन",
      scOutbreakTitle: "ग्राम संक्रमण प्रकोप संसूचन",
      scCrdtTitle: "अन्तर्जाल-रहित द्वन्द्व-रहित विलय प्रमाण",
      scReset: "पुनःस्थापन",
      runEnrichment: "संवर्धन",
      runningEnrichment: "प्रगति पर...",
      badgeOffline: "अन्तर्जाल-रहित",
      themeLight: "प्रकाश रूप",
      themeDark: "रात्रि रूप",
      langToggle: "English",
      backToHub: "← केन्द्र",
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
      colWatchSub: "परिवार एवं स्वास्थ्य कर्मी",
      colPhoneTitle: "आशा क्षेत्र दूरभाष",
      colPhoneSub: "निश्चित वर्गीकरण एवं स्थानीय संग्रहण",
      colHubTitle: "प्राथमिक स्वास्थ्य केन्द्र प्रज्ञा",
      colHubSub: "ध्वनि अनुलेखन · संकट कारक विश्लेषण · प्रकोप संसूचन",
      watchCap1: "स्वावलम्बी आपात",
      watchCap2: "एक-स्पर्श लक्षण",
      watchCap3: "कार्य सूचना",
      phoneCap1: "नियम वर्गीकरण",
      phoneCap2: "स्वर पंक्ति",
      phoneCap3: "कालक्रम समन्वय",
      kpiPatients: "रोगी",
      kpiRed: "रक्त",
      kpiYellow: "पीत",
      kpiGreen: "हरित",
      kpiPending: "प्रतीक्षारत",
      hubPeersTitle: "सहकर्मी",
      tabAlerts: "चेतावनी एवं पत्रक",
      tabShap: "संकट एवं वर्गीकरण",
      tabStream: "घटना प्रवाह",
      hubActionsTitle: "कार्य पत्रक → घटिका एवं दूरभाष",
      hubOutbreaksTitle: "संक्रमण प्रकोप चेतावनी",
      hubShapTitle: "संकट कारक विश्लेषण (SHAP)",
      hubTriageTitle: "तत्काल चिकित्सकीय वर्गीकरण",
      hubEventsTitle: "नवीनतम घटना प्रवाह",
      noPeers: "अभी कोई सहकर्मी संयोजित नहीं है।",
      noTriage: "अभी कोई चिकित्सकीय वर्गीकरण नहीं है।",
      noShap: "अभी कोई संकट कारक विश्लेषण उपलब्ध नहीं है।",
      noActions: "अभी कोई कार्य पत्रक जारी नहीं हुआ है।",
      noOutbreaks: "कोई सक्रिय संक्रमण प्रकोप चेतावनी नहीं है।",
      noEvents: "घटनाओं की प्रतीक्षा...",
      outbreakPrefix: "संक्रमण प्रकोप चेतावनी",
      riskLabel: "संकट",
      eventsUnit: "घटनाएँ",
      moreItems: "+{n} अतिरिक्त",
      peerWatchFamily: "घटिका · परिवार",
      peerWatchChw: "घटिका · स्वास्थ्य कर्मी",
      peerPhoneAsha: "दूरभाष · आशा",
      peerHub: "मुख्य केन्द्र",
      targetWatch: "घटिका",
      targetPhone: "दूरभाष",
      targetMesh: "संजाल",
      sevRed: "रक्त · आपातकाल",
      sevYellow: "पीत · स्वास्थ्य केन्द्र",
      sevGreen: "हरित · गृह देखभाल",
      prioCritical: "अत्यन्त गम्भीर",
      prioHigh: "उच्च",
      prioMedium: "मध्यम",
      prioLow: "न्यून",
      proofCloudRpcs: "० मेघ-सेवा अनुरोध",
      proofSafetyFloor: "विश्व स्वास्थ्य सुरक्षा स्तर · १.००",
      proofZeroBloat: "० भारी तन्त्र भार",
      convergedPatientsUnit: "अभिसरित रोगी",
      hubCrdtMergeTitle: "द्वन्द्व-रहित विलय प्रमाण (LWW)",
      zeroDataLoss: "शून्य तथ्यांश हानि",
      simultaneousTieBreak: "समान कालक्रम संयोग",
      convergedRecord: "एकीकृत रोगी अभिलेख",
      stageAudio: "श्रव्य संचिका",
      stageAsr: "ध्वनि अनुलेखन",
      stageSlm: "संरचना प्रज्ञा",
      stageTriage: "निश्चित वर्गीकरण (१.००)",
      stageShap: "संकट कारक विश्लेषण",
      symptomsLabel: "चिह्नित लक्षण",
      dangerFlagsLabel: "संकट संकेत",
      shapPosLegend: "+ संकट वर्धक",
      shapNegLegend: "- संरक्षक कारक",
    },
  };

  const SCENARIO_TITLE_KEYS = {
    maternal_sos: "scMaternalTitle",
    pediatric_voice_offload: "scVoiceTitle",
    village_outbreak: "scOutbreakTitle",
    crdt_conflict_merge: "scCrdtTitle",
  };

  function readPref(key, allowed, fallback) {
    try {
      const val = window.localStorage.getItem(key);
      if (val && allowed.includes(val)) return val;
    } catch (_err) {
      // Fail-soft when storage is unavailable
    }
    return fallback;
  }

  function writePref(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (_err) {
      // Fail-soft when storage is unavailable
    }
  }

  const state = {
    lang: readPref(STORAGE_LANG_KEY, ["en", "hi"], "en"),
    theme: readPref(STORAGE_THEME_KEY, ["dark", "light"], "dark"),
    activeTab: "alerts",
    activeScenario: null,
    scenarioCatalog: {},
    narrativeState: { kind: "default" },
    lastEventCount: -1,
    lastHlcKey: "",
    pulseTimer: null,
    polling: false,
    lastSummary: null,
    lastPeers: [],
    lastEvents: [],
  };

  function t(key) {
    return (I18N[state.lang] && I18N[state.lang][key]) || I18N.en[key] || key;
  }

  function formatMore(extraCount) {
    return t("moreItems").replace("{n}", String(extraCount));
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

  function severityLabel(sev) {
    if (sev === "RED_EMERGENCY") return t("sevRed");
    if (sev === "YELLOW_PHC") return t("sevYellow");
    return t("sevGreen");
  }

  function priorityLabel(prio) {
    if (prio === "CRITICAL") return t("prioCritical");
    if (prio === "HIGH") return t("prioHigh");
    if (prio === "LOW") return t("prioLow");
    return t("prioMedium");
  }

  function targetTierLabel(tier) {
    if (tier === "TIER_0_WATCH") return t("targetWatch");
    if (tier === "TIER_1_PHONE") return t("targetPhone");
    return t("targetMesh");
  }

  function humanizePeer(peer) {
    const m = peer.manifest || peer;
    const tier = m.tier || peer.tier || "";
    const mode = m.watch_mode || peer.watch_mode || "";
    if (tier === "TIER_0_WATCH") {
      return mode === "PATIENT_FAMILY" ? t("peerWatchFamily") : t("peerWatchChw");
    }
    if (tier === "TIER_1_PHONE") {
      return t("peerPhoneAsha");
    }
    if (tier === "TIER_2_HUB") {
      return t("peerHub");
    }
    return m.node_id || peer.node_id || "Peer";
  }

  function buildPatientMap(summary) {
    const map = new Map();
    const list = summary && Array.isArray(summary.patients) ? summary.patients : [];
    for (const pat of list) {
      if (pat && pat.patient_id) {
        map.set(pat.patient_id, pat.full_name || pat.patient_id);
      }
    }
    return map;
  }

  function formatPatientName(patientId, patientMap, fallback) {
    if (patientId && patientMap.has(patientId)) {
      return patientMap.get(patientId);
    }
    return patientId || fallback || "--";
  }

  function renderNarrative() {
    const ns = state.narrativeState;
    if (ns.kind === "scenario_loading") {
      setText("narrative-text", t("scenarioRunning"));
      return;
    }
    if (ns.kind === "scenario_loaded") {
      const titleKey = SCENARIO_TITLE_KEYS[ns.scenarioId];
      const localizedTitle = titleKey ? t(titleKey) : ns.scenarioId;
      const catItem = state.scenarioCatalog[ns.scenarioId];
      const suffix =
        state.lang === "en" && catItem && catItem.subtitle
          ? ` — ${catItem.subtitle}`
          : ` (${ns.eventsAdded} ${t("eventsUnit")}, ${ns.patientCount} ${t("kpiPatients")})`;
      setText("narrative-text", `${t("scenarioDonePrefix")} ${localizedTitle}${suffix}`);
      return;
    }
    if (ns.kind === "reset") {
      setText("narrative-text", t("resetDone"));
      return;
    }
    if (ns.kind === "enrichment_ok") {
      setText("narrative-text", t("enrichmentDone"));
      return;
    }
    if (ns.kind === "error") {
      setText("narrative-text", t("endpointUnavailable"));
      return;
    }
    setText("narrative-text", t("defaultNarrative"));
  }

  function applyTheme() {
    document.documentElement.setAttribute("data-theme", state.theme);
    setText("btn-stage-theme", state.theme === "dark" ? t("themeLight") : t("themeDark"));
  }

  function applyTranslations() {
    document.documentElement.lang = state.lang;
    setText("stage-title", t("stageTitle"));
    setText("stage-subtitle", t("stageSubtitle"));
    setText("btn-stage-lang", t("langToggle"));
    applyTheme();

    const nodes = document.querySelectorAll("[data-i18n]");
    for (const node of nodes) {
      const key = node.getAttribute("data-i18n");
      if (key) node.textContent = t(key);
    }
    renderNarrative();
  }

  function setActiveHubTab(tabId) {
    state.activeTab = tabId;
    const buttons = document.querySelectorAll("[data-hub-tab]");
    for (const btn of buttons) {
      const isSelected = btn.getAttribute("data-hub-tab") === tabId;
      btn.classList.toggle("active", isSelected);
      btn.setAttribute("aria-selected", String(isSelected));
    }

    const panelIds = {
      alerts: "hub-panel-alerts",
      shap: "hub-panel-shap",
      stream: "hub-panel-stream",
    };
    for (const [key, panelId] of Object.entries(panelIds)) {
      const panel = document.getElementById(panelId);
      if (panel) panel.classList.toggle("hidden", key !== tabId);
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

  function formatCompactFieldValue(val) {
    if (Array.isArray(val)) return val.join(", ");
    if (typeof val === "boolean") return val ? "true" : "false";
    return String(val);
  }

  function buildCrdtMergeProofCard(proof) {
    const contribs = Array.isArray(proof.contributions) ? proof.contributions : [];
    const flowNodes = [];

    // Show the latest contribution per distinct origin node for crisp diff clarity
    const latestByOrigin = new Map();
    for (const c of contribs) {
      if (c && c.origin_node_id) {
        latestByOrigin.set(c.origin_node_id, c);
      }
    }
    const peerEdits = Array.from(latestByOrigin.values());

    peerEdits.forEach((edit, idx) => {
      if (idx > 0) {
        flowNodes.push(el("div", { className: "crdt-op-sep mono" }, "⊕"));
      }
      const fieldChips = Object.entries(edit.fields || {})
        .slice(0, 5)
        .map(([k, v]) =>
          el("span", { className: "crdt-kv-chip mono" }, `${k.replace(/^metadata\./, "")}=${formatCompactFieldValue(v)}`)
        );
      const shortHlc = edit.hlc ? `${edit.hlc.wall_ms}:${edit.hlc.logical}` : edit.hlc_str || "--";
      flowNodes.push(
        el(
          "div",
          { className: "crdt-contrib-box" },
          el(
            "div",
            { className: "crdt-contrib-head" },
            el("span", { className: "mono" }, edit.origin_node_id),
            el("span", { className: "badge badge-accent mono" }, `HLC ${shortHlc}`)
          ),
          fieldChips.length > 0 ? el("div", { className: "crdt-kv-row" }, ...fieldChips) : null
        )
      );
    });

    flowNodes.push(el("div", { className: "crdt-op-sep mono" }, "⇒"));

    const convergedChips = Object.entries(proof.converged_fields || {})
      .slice(0, 7)
      .map(([k, v]) =>
        el("span", { className: "crdt-kv-chip mono" }, `${k.replace(/^metadata\./, "")}=${formatCompactFieldValue(v)}`)
      );
    flowNodes.push(
      el(
        "div",
        { className: "crdt-contrib-box crdt-contrib-converged" },
        el(
          "div",
          { className: "crdt-contrib-head" },
          el("span", null, `${t("convergedRecord")}: ${proof.full_name || proof.patient_id}`),
          el("span", { className: "badge badge-green" }, t("zeroDataLoss"))
        ),
        convergedChips.length > 0 ? el("div", { className: "crdt-kv-row" }, ...convergedChips) : null
      )
    );

    return el(
      "div",
      { className: "crdt-merge-card" },
      el(
        "div",
        { className: "hub-card-head" },
        el("span", { className: "hub-card-title" }, proof.full_name || proof.patient_id),
        proof.simultaneous_wall_ms
          ? el("span", { className: "badge badge-accent" }, t("simultaneousTieBreak"))
          : el("span", { className: "badge badge-green" }, t("zeroDataLoss"))
      ),
      el("div", { className: "crdt-contrib-flow" }, ...flowNodes)
    );
  }

  function renderEngineeringProofStrip(summary) {
    const ep = (summary && summary.engineering_proof) || {};
    const eventsCount = summary ? summary.event_count ?? 0 : 0;
    const patientCount = summary ? summary.patient_count ?? 0 : 0;
    const hlcText =
      summary && summary.latest_hlc ? `HLC ${formatHlc(summary.latest_hlc)}` : "HLC --";

    setText("proof-cloud-rpcs", t("proofCloudRpcs"));
    setText("proof-safety-floor", t("proofSafetyFloor"));
    setText("proof-hlc-vector", hlcText);
    setText(
      "proof-crdt-ratio",
      `${ep.crdt_event_count ?? eventsCount} ${t("eventsUnit")} → ${ep.converged_patient_count ?? patientCount} ${t("convergedPatientsUnit")}`
    );
    setText("proof-zero-bloat", t("proofZeroBloat"));
  }

  function renderHubBrain() {
    const summary = state.lastSummary;
    const peers = state.lastPeers;
    const events = state.lastEvents;
    const patientMap = buildPatientMap(summary);
    renderEngineeringProofStrip(summary);

    if (summary) {
      const manifest = summary.manifest;
      if (manifest && manifest.ram_mb) {
        const ramGb = Math.max(1, Math.round(manifest.ram_mb / 1024));
        setText("hub-tier-eyebrow", `TIER 2 · ${ramGb} GB PHC HUB BRAIN`);
      }

      const tc = summary.triage_counts || {};
      setText("hub-kpi-patients", summary.patient_count ?? 0);
      setText("hub-kpi-red", tc.RED_EMERGENCY ?? 0);
      setText("hub-kpi-yellow", tc.YELLOW_PHC ?? 0);
      setText("hub-kpi-green", tc.GREEN_HOME ?? 0);
      setText("hub-kpi-pending", summary.pending_enrichments ?? 0);
      setText("stage-metric-events", `${summary.event_count ?? 0} ${t("eventsUnit")}`);
      setText("stage-metric-hlc", summary.latest_hlc ? `HLC ${formatHlc(summary.latest_hlc)}` : "HLC --");

      // Pinned Outbreak Banner (never scrolls out of view)
      const ob = document.getElementById("hub-outbreak-banner");
      const alerts = Array.isArray(summary.outbreak_alerts) ? summary.outbreak_alerts : [];
      setText("hub-outbreaks-count", alerts.length);
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

      // Outbreak list inside Alerts & Cards tab
      const obList = document.getElementById("hub-outbreaks-list");
      if (obList) {
        if (alerts.length === 0) {
          obList.replaceChildren(el("p", { className: "empty-state" }, t("noOutbreaks")));
        } else {
          const visibleAlerts = alerts.slice(0, 3).map((alert) => {
            const p = alert.payload || {};
            const title = p.syndrome || p.disease || p.title || alert.event_type;
            const village = p.village_id || "EWMA";
            const detail = p.message || p.rationale || "";
            return el(
              "div",
              { className: "hub-card hub-card-red" },
              el(
                "div",
                { className: "hub-card-head" },
                el("span", { className: "hub-card-title" }, title),
                el("span", { className: "badge badge-red mono" }, village)
              ),
              detail ? el("div", { className: "hub-card-meta" }, detail) : null
            );
          });
          if (alerts.length > 3) {
            visibleAlerts.push(el("span", { className: "badge badge-more" }, formatMore(alerts.length - 3)));
          }
          obList.replaceChildren(...visibleAlerts);
        }
      }

      // Action Cards inside Alerts & Cards tab
      const actContainer = document.getElementById("hub-actions-list");
      const actionCards = Array.isArray(summary.action_cards) ? summary.action_cards : [];
      setText("hub-actions-count", actionCards.length);
      setText("tab-count-alerts", actionCards.length + alerts.length);
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
            const patName = formatPatientName(card.patient_id, patientMap, "");
            const targetText = targetTierLabel(card.target_tier);
            return el(
              "div",
              { className: cardCls },
              el(
                "div",
                { className: "hub-card-head" },
                el("span", { className: "hub-card-title" }, card.title || card.card_id),
                el("span", { className: badgeCls }, priorityLabel(prio))
              ),
              card.summary ? el("div", { className: "hub-card-meta" }, card.summary) : null,
              el("div", { className: "hub-card-meta" }, `${patName} → ${targetText}`)
            );
          });
          if (actionCards.length > 4) {
            cards.push(el("span", { className: "badge badge-more" }, formatMore(actionCards.length - 4)));
          }
          actContainer.replaceChildren(...cards);
        }
      }

      // CRDT LWW Conflict-Free Merge Proof Cards (Alerts & Stream tabs)
      const mergeProofs = Array.isArray(summary.crdt_merge_proofs) ? summary.crdt_merge_proofs : [];
      for (const [wrapId, listId] of [
        ["hub-crdt-proof-alerts", "hub-crdt-proof-alerts-list"],
        ["hub-crdt-proof-stream", "hub-crdt-proof-stream-list"],
      ]) {
        const wrap = document.getElementById(wrapId);
        const listEl = document.getElementById(listId);
        if (!wrap || !listEl) continue;
        if (mergeProofs.length > 0) {
          wrap.classList.remove("hidden");
          listEl.replaceChildren(...mergeProofs.slice(0, 2).map((pf) => buildCrdtMergeProofCard(pf)));
        } else {
          wrap.classList.add("hidden");
          listEl.replaceChildren();
        }
      }

      // SHAP Bars + Enrichment Pipeline Provenance inside SHAP & Triage tab
      const shapContainer = document.getElementById("hub-shap-list");
      const enrichments = Array.isArray(summary.enrichments) ? summary.enrichments : [];
      setText("hub-shap-count", enrichments.length);
      if (shapContainer) {
        if (enrichments.length === 0) {
          shapContainer.replaceChildren(el("p", { className: "empty-state" }, t("noShap")));
        } else {
          const cards = enrichments.slice(0, 3).map((item) => {
            const entries = normalizeShap(item.shap_attributions).sort(
              (a, b) => Math.abs(b.value) - Math.abs(a.value)
            );
            const maxAbs = Math.max(0.01, ...entries.map((e) => Math.abs(e.value)));
            const scoreText =
              item.risk_score !== null && item.risk_score !== undefined
                ? `${t("riskLabel")}: ${Number(item.risk_score).toFixed(2)}`
                : item.risk_band || "AI";
            const patName = formatPatientName(item.patient_id, patientMap, item.event_id);

            const stageLabels = [
              item.audio_source === "blob" ? `${t("stageAudio")}` : t("stageAsr"),
              t("stageSlm"),
              item.triage_severity ? `${t("stageTriage")}` : null,
              t("stageShap"),
            ].filter(Boolean);
            const pipelineNodes = [];
            stageLabels.forEach((lbl, idx) => {
              if (idx > 0) pipelineNodes.push(el("span", { className: "pipeline-arrow" }, "→"));
              pipelineNodes.push(el("span", { className: "pipeline-stage mono" }, lbl));
            });

            const symptoms = Array.isArray(item.extracted_symptoms) ? item.extracted_symptoms : [];
            const dangerFlags = Array.isArray(item.candidate_danger_flags) ? item.candidate_danger_flags : [];
            const tagChips = [
              ...dangerFlags.slice(0, 3).map((flag) =>
                el("span", { className: "badge badge-red mono" }, `${t("dangerFlagsLabel")}: ${flag}`)
              ),
              ...symptoms.slice(0, 3).map((sym) =>
                el("span", { className: "crdt-kv-chip mono" }, `${t("symptomsLabel")}: ${sym}`)
              ),
            ];

            const rows = entries.slice(0, 6).map((entry) => {
              const pct = Math.min(100, Math.round((Math.abs(entry.value) / maxAbs) * 100));
              const isPos = entry.value >= 0;
              const fill = el("div", { className: isPos ? "shap-fill-pos" : "shap-fill-neg" });
              fill.style.width = `${pct}%`;
              return el(
                "div",
                { className: "shap-row" },
                el("span", { className: "mono shap-name", title: entry.name }, entry.name),
                el("div", { className: "shap-track" }, fill),
                el(
                  "span",
                  { className: `mono shap-num ${isPos ? "shap-num-pos" : "shap-num-neg"}` },
                  (isPos ? "+" : "") + entry.value.toFixed(2)
                )
              );
            });

            return el(
              "div",
              { className: "hub-card" },
              el(
                "div",
                { className: "hub-card-head" },
                el("span", { className: "hub-card-title", title: item.patient_id || "" }, patName),
                el("span", { className: "badge badge-yellow" }, scoreText)
              ),
              el("div", { className: "pipeline-trace" }, ...pipelineNodes),
              item.transcript
                ? el("div", { className: "transcript-snippet" }, `"${String(item.transcript).slice(0, 120)}"`)
                : null,
              tagChips.length > 0 ? el("div", { className: "crdt-kv-row" }, ...tagChips) : null,
              item.summary ? el("div", { className: "hub-card-meta" }, item.summary) : null,
              rows.length > 0
                ? el(
                    "div",
                    { className: "shap-legend" },
                    el("span", { className: "shap-legend-pos" }, t("shapPosLegend")),
                    el("span", { className: "shap-legend-neg" }, t("shapNegLegend"))
                  )
                : null,
              ...rows
            );
          });
          if (enrichments.length > 3) {
            cards.push(el("span", { className: "badge badge-more" }, formatMore(enrichments.length - 3)));
          }
          shapContainer.replaceChildren(...cards);
        }
      }

      // Real-time Triage Decisions inside SHAP & Triage tab
      const triageContainer = document.getElementById("hub-triage-list");
      const history = Array.isArray(summary.triage_history) ? summary.triage_history : [];
      const enrTriages = [];
      for (const enr of enrichments) {
        const ta = enr && enr.payload && enr.payload.triage_assessment;
        if (ta && typeof ta === "object" && ta.severity) enrTriages.push(ta);
      }
      const triages = [...history, ...enrTriages].reverse();
      setText("hub-triage-count", triages.length);
      setText("tab-count-shap", enrichments.length + triages.length);
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
            const patName = formatPatientName(item.patient_id, patientMap, item.assessment_id);
            return el(
              "div",
              { className: cardCls },
              el(
                "div",
                { className: "hub-card-head" },
                el("span", { className: "hub-card-title", title: item.patient_id || "" }, patName),
                el("span", { className: badgeCls }, severityLabel(sev))
              ),
              item.rationale ? el("div", { className: "hub-card-meta" }, item.rationale) : null
            );
          });
          if (triages.length > 4) {
            cards.push(el("span", { className: "badge badge-more" }, formatMore(triages.length - 4)));
          }
          triageContainer.replaceChildren(...cards);
        }
      }
    }

    // Humanized Synced Peers strip
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

    if (peersContainer) {
      if (peerList.length === 0) {
        peersContainer.replaceChildren(el("span", { className: "peer-empty" }, t("noPeers")));
      } else {
        const chips = peerList.slice(0, 4).map((p) => {
          const m = p.manifest || p;
          const nodeId = m.node_id || p.node_id || "peer";
          return el(
            "span",
            { className: "peer-chip", title: nodeId },
            el("span", { className: "peer-chip-dot", "aria-hidden": "true" }),
            el("span", null, humanizePeer(p))
          );
        });
        if (peerList.length > 4) {
          chips.push(el("span", { className: "badge badge-more" }, formatMore(peerList.length - 4)));
        }
        peersContainer.replaceChildren(...chips);
      }
    }

    // CRDT Sync Stream inside CRDT Stream tab
    const eventsContainer = document.getElementById("hub-events-list");
    const evList = Array.isArray(events) ? events : [];
    const totalEvents = summary ? summary.event_count ?? evList.length : evList.length;
    setText("hub-events-count", totalEvents);
    setText("tab-count-stream", totalEvents);
    if (eventsContainer) {
      if (evList.length === 0) {
        eventsContainer.replaceChildren(el("p", { className: "empty-state" }, t("noEvents")));
      } else {
        const visible = evList.slice(0, 8);
        const rows = visible.map((evt) => {
          const patName = evt.patient_id
            ? formatPatientName(evt.patient_id, patientMap, evt.patient_id)
            : "--";
          return el(
            "div",
            { className: "stream-row" },
            el(
              "div",
              { className: "stream-left" },
              el("span", { className: "stream-origin mono" }, evt.origin_node_id || "--"),
              el("span", { className: "stream-meta" }, `${patName} · ${formatHlc(evt.hlc)}`)
            ),
            el("span", { className: "badge badge-accent mono" }, evt.event_type)
          );
        });
        if (totalEvents > visible.length) {
          rows.push(el("span", { className: "badge badge-more" }, formatMore(totalEvents - visible.length)));
        }
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

  async function loadScenarioCatalog() {
    const data = await fetchJsonSafe("/api/v1/demo/scenarios");
    if (Array.isArray(data)) {
      for (const item of data) {
        if (item && item.id) {
          state.scenarioCatalog[item.id] = item;
        }
      }
    }
  }

  async function pollHub() {
    if (state.polling) return;
    state.polling = true;
    try {
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
    } finally {
      state.polling = false;
    }
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
    state.narrativeState = { kind: "scenario_loading", scenarioId };
    renderNarrative();

    try {
      const res = await fetch(`/api/v1/demo/load/${encodeURIComponent(scenarioId)}`, {
        method: "POST",
      });
      if (!res.ok) {
        state.narrativeState = { kind: "error" };
        renderNarrative();
        return;
      }
      const data = await res.json();
      state.activeScenario = scenarioId;
      updateScenarioPills();
      state.narrativeState = {
        kind: "scenario_loaded",
        scenarioId,
        eventsAdded: data.events_added ?? 0,
        patientCount: data.patient_count ?? 0,
      };
      renderNarrative();
      triggerSyncPulse();
      await pollHub();
    } catch (_err) {
      state.narrativeState = { kind: "error" };
      renderNarrative();
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
        state.narrativeState = { kind: "error" };
        renderNarrative();
        return;
      }
      state.activeScenario = null;
      updateScenarioPills();
      state.narrativeState = { kind: "reset" };
      renderNarrative();
      await pollHub();
    } catch (_err) {
      state.narrativeState = { kind: "error" };
      renderNarrative();
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
      state.narrativeState = res.ok ? { kind: "enrichment_ok" } : { kind: "error" };
      renderNarrative();
      if (res.ok) triggerSyncPulse();
      await pollHub();
    } catch (_err) {
      state.narrativeState = { kind: "error" };
      renderNarrative();
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = t("runEnrichment");
      }
    }
  }

  function reloadIframe(frameId, fallbackSrc) {
    const frame = document.getElementById(frameId);
    if (!frame) return;
    try {
      if (frame.contentWindow) {
        frame.contentWindow.location.reload();
        return;
      }
    } catch (_err) {
      // Cross-origin fallback
    }
    frame.setAttribute("src", fallbackSrc);
  }

  function bindEvents() {
    const themeBtn = document.getElementById("btn-stage-theme");
    if (themeBtn) {
      themeBtn.addEventListener("click", () => {
        state.theme = state.theme === "dark" ? "light" : "dark";
        writePref(STORAGE_THEME_KEY, state.theme);
        applyTheme();
      });
    }

    const langBtn = document.getElementById("btn-stage-lang");
    if (langBtn) {
      langBtn.addEventListener("click", () => {
        state.lang = state.lang === "en" ? "hi" : "en";
        writePref(STORAGE_LANG_KEY, state.lang);
        applyTranslations();
        renderHubBrain();
      });
    }

    const tabBtns = document.querySelectorAll("[data-hub-tab]");
    for (const btn of tabBtns) {
      btn.addEventListener("click", () => {
        const tab = btn.getAttribute("data-hub-tab");
        if (tab) setActiveHubTab(tab);
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
        reloadIframe("iframe-watch", "/watch/?embed=1");
      });
    }

    const reloadPhone = document.getElementById("btn-reload-phone");
    if (reloadPhone) {
      reloadPhone.addEventListener("click", () => {
        reloadIframe("iframe-phone", "/phone/");
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    bindEvents();
    applyTranslations();
    setActiveHubTab(state.activeTab);
    loadScenarioCatalog();
    pollHub();
    setInterval(() => {
      if (!document.hidden) pollHub();
    }, 2000);
  });
})();
