(() => {
  "use strict";

  const STORAGE_LANG_KEY = "aarogya.lang";
  const STORAGE_THEME_KEY = "aarogya.theme";

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
      demoBarLabel: "Live Scenarios",
      scenarioMaternal: "Maternal Watch SOS",
      scenarioVoice: "Offline Voice → AI",
      scenarioOutbreak: "Village Outbreak",
      scenarioCrdt: "CRDT Merge Proof",
      demoReset: "Reset",
      openShowcase: "Open 3-Tier Live Stage →",
      demoLoading: "Running live clinical scenario...",
      demoLoaded: "Scenario executed through live CRDT sync:",
      demoResetting: "Resetting Hub state...",
      demoResetDone: "Hub SQLite event store and peer registry cleared.",
      demoUnavailable: "Demo scenario endpoint unavailable.",
      scenarioStepsLabel: "Clinical Flow",
      dismiss: "Dismiss",
      archTitle: "Compute-Proportional 3-Tier Autonomous Mesh",
      tier0Label: "Tier-0 Watch",
      tier0Desc: "Standalone SOS & Reminders for Normal Public & CHW",
      tier1Label: "Tier-1 Phone",
      tier1Desc: "WHO IMNCI Deterministic Triage + Offline IndexedDB",
      tier2Label: "Tier-2 Hub",
      tier2Desc: "Whisper + SLM + LightGBM SHAP + EWMA Outbreak",
      activePeersShort: "active",
      hubOnlineShort: "online",
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
      clinicalPanel: "Clinical Triage, Action Cards & SHAP Risk",
      triageFeedTitle: "Active Triage Decisions",
      patientsRosterTitle: "Synced Patient Registry & Peers",
      peerTopology: "Live Mesh Peers",
      hubTelemetryTitle: "Hub Hardware & LAN Discovery",
      runEnrichment: "Run Hub Enrichment",
      runningEnrichment: "Running Enrichment...",
      enrichmentDone: "Enrichment cycle completed.",
      enrichmentUnavailable: "Enrichment endpoint unavailable.",
      outbreakAlerts: "EWMA Outbreak Alerts",
      shapTitle: "SHAP Risk Attributions",
      actionCards: "Action Cards",
      eventLog: "HLC CRDT Event Log Inspector",
      showEventLog: "Show Log",
      hideEventLog: "Hide Log",
      filterEvents: "Filter by event type",
      allEvents: "All Events",
      colHlc: "HLC Timestamp",
      colOrigin: "Origin Node",
      colType: "Event Type",
      colPatient: "Patient",
      colEnrichment: "Enrichment",
      colSummary: "Payload",
      noPatients: "No patients synced yet. Launch a scenario above or sync a peer.",
      noTriage: "No triage assessments recorded yet.",
      noPeers: "No mesh peers connected yet.",
      noOutbreaks: "No active outbreak alerts.",
      noShap: "No completed SHAP risk enrichments yet.",
      noActionCards: "No active action cards.",
      noEvents: "No CRDT events recorded yet.",
      battery: "Battery",
      riskScore: "Risk Score",
      outbreakBannerPrefix: "ACTIVE EWMA OUTBREAK ALERT",
      pregnantWeeks: "Pregnant",
      referralYes: "PHC Referral",
      eventsUnit: "events",
      peersUnit: "peers",
      moreCount: "+{n} more",
      villagePrefix: "Village:",
      sevRed: "RED_EMERGENCY",
      sevYellow: "YELLOW_PHC",
      sevGreen: "GREEN_HOME",
      prioCritical: "CRITICAL",
      prioHigh: "HIGH",
      prioMedium: "MEDIUM",
      prioLow: "LOW",
      statusOpen: "OPEN",
      statusAcknowledged: "ACKNOWLEDGED",
      statusCompleted: "COMPLETED",
      statusDismissed: "DISMISSED",
      riskHigh: "HIGH",
      riskModerate: "MODERATE",
      riskLow: "LOW",
      riskEnriched: "ENRICHED",
      enrPending: "PENDING",
      enrCompleted: "COMPLETED",
      enrNotNeeded: "NOT_NEEDED",
      enrFailed: "FAILED",
      watchModeChw: "CHW_COMPANION",
      watchModeFamily: "PATIENT_FAMILY",
      expandPayload: "Click to expand JSON payload",
      collapsePayload: "Click to collapse JSON payload",
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
      demoBarLabel: "प्रदर्शन परिदृश्य",
      scenarioMaternal: "मातृ घटिका आपात संकेत",
      scenarioVoice: "अन्तर्जाल-रहित स्वर → प्रज्ञा",
      scenarioOutbreak: "ग्राम संक्रमण प्रकोप",
      scenarioCrdt: "द्वन्द्व-रहित विलय प्रमाण",
      demoReset: "पुनःस्थापन",
      openShowcase: "त्रि-स्तरीय जीवन्त मंच →",
      demoLoading: "जीवन्त चिकित्सकीय परिदृश्य प्रारम्भ हो रहा है...",
      demoLoaded: "परिदृश्य वास्तविक समन्वय द्वारा पूर्ण हुआ:",
      demoResetting: "मुख्य केन्द्र पुनःस्थापित हो रहा है...",
      demoResetDone: "घटना अभिलेख एवं सहकर्मी सूची स्वच्छ हुई।",
      demoUnavailable: "परिदृश्य सेवा अभी संयोजित नहीं है।",
      scenarioStepsLabel: "चिकित्सकीय क्रम",
      dismiss: "बन्द करें",
      archTitle: "क्षमता-आधारित त्रि-स्तरीय स्वावलम्बी संजाल संरचना",
      tier0Label: "स्तर-० घटिका",
      tier0Desc: "सामान्य जन एवं स्वास्थ्य कार्यकर्ता हेतु स्वावलम्बी आपात संकेत एवं स्मरण",
      tier1Label: "स्तर-१ दूरभाष",
      tier1Desc: "विश्व स्वास्थ्य संगठन नियम वर्गीकरण एवं स्थानीय संग्रहण",
      tier2Label: "स्तर-२ मुख्य केन्द्र",
      tier2Desc: "ध्वनि अनुलेखन · संकट कारक विश्लेषण · प्रकोप संसूचन",
      activePeersShort: "सक्रिय",
      hubOnlineShort: "सक्रिय",
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
      clinicalPanel: "चिकित्सकीय वर्गीकरण, कार्य पत्रक एवं संकट विश्लेषण",
      triageFeedTitle: "सक्रिय चिकित्सकीय वर्गीकरण",
      patientsRosterTitle: "समन्वित रोगी पंजिका एवं सहकर्मी",
      peerTopology: "जीवन्त संजाल सहकर्मी",
      hubTelemetryTitle: "मुख्य केन्द्र उपकरण एवं स्थानीय सम्पर्क",
      runEnrichment: "तत्काल संवर्धन चलाएँ",
      runningEnrichment: "संवर्धन प्रगति पर...",
      enrichmentDone: "संवर्धन चक्र पूर्ण हुआ।",
      enrichmentUnavailable: "संवर्धन सेवा अभी संयोजित नहीं है।",
      outbreakAlerts: "संक्रमण प्रकोप चेतावनी",
      shapTitle: "संकट कारक विश्लेषण (SHAP)",
      actionCards: "तत्काल कार्य पत्रक",
      eventLog: "जीवन्त कालक्रम घटना अभिलेख निरीक्षक",
      showEventLog: "अभिलेख दिखाएँ",
      hideEventLog: "अभिलेख छिपाएँ",
      filterEvents: "घटना प्रकार चयन",
      allEvents: "समस्त घटनाएँ",
      colHlc: "कालक्रम मुहर",
      colOrigin: "उद्गम केन्द्र",
      colType: "घटना प्रकार",
      colPatient: "रोगी",
      colEnrichment: "संवर्धन स्थिति",
      colSummary: "विवरण",
      noPatients: "अभी कोई रोगी पंजीकृत नहीं है। ऊपर से परिदृश्य चुनें।",
      noTriage: "अभी कोई चिकित्सकीय वर्गीकरण अभिलेखित नहीं है।",
      noPeers: "कोई संजाल सहकर्मी अभी संयोजित नहीं है।",
      noOutbreaks: "कोई सक्रिय संक्रमण प्रकोप चेतावनी नहीं है।",
      noShap: "अभी कोई संकट कारक संवर्धन उपलब्ध नहीं है।",
      noActionCards: "कोई सक्रिय कार्य पत्रक नहीं है।",
      noEvents: "अभिलेख में अभी कोई घटना नहीं है।",
      battery: "विद्युत स्तर",
      riskScore: "संकट सूचकांक",
      outbreakBannerPrefix: "सक्रिय संक्रमण प्रकोप चेतावनी",
      pregnantWeeks: "गर्भावस्था",
      referralYes: "शीघ्र स्वास्थ्य केन्द्र प्रेषण",
      eventsUnit: "घटनाएँ",
      peersUnit: "सहकर्मी",
      moreCount: "+{n} अतिरिक्त",
      villagePrefix: "ग्राम:",
      sevRed: "रक्त · आपातकाल",
      sevYellow: "पीत · स्वास्थ्य केन्द्र",
      sevGreen: "हरित · गृह देखभाल",
      prioCritical: "अति गम्भीर",
      prioHigh: "उच्च",
      prioMedium: "मध्यम",
      prioLow: "सामान्य",
      statusOpen: "सक्रिय",
      statusAcknowledged: "स्वीकृत",
      statusCompleted: "पूर्ण",
      statusDismissed: "निरस्त",
      riskHigh: "उच्च संकट",
      riskModerate: "मध्यम संकट",
      riskLow: "न्यून संकट",
      riskEnriched: "संवर्धित",
      enrPending: "प्रतीक्षारत",
      enrCompleted: "पूर्ण",
      enrNotNeeded: "अनावश्यक",
      enrFailed: "विफल",
      watchModeChw: "स्वास्थ्य कर्मी सहायक",
      watchModeFamily: "रोगी परिवार",
      expandPayload: "पूर्ण विवरण देखने हेतु स्पर्श करें",
      collapsePayload: "विवरण संक्षिप्त करने हेतु स्पर्श करें",
    },
  };

  const state = {
    lang: "en",
    theme: "dark",
    autoRefresh: true,
    timerId: null,
    selectedEventType: "",
    eventsExpanded: false,
    activeScenario: null,
    scenarioCatalog: {},
    narrativeDismissed: false,
    expandedEventIds: new Set(),
    lastSummary: null,
    lastPeers: [],
    lastConnectInfo: null,
    lastEvents: [],
  };

  function readStoredPref(key, allowed, fallback) {
    try {
      const value = window.localStorage.getItem(key);
      if (value && allowed.includes(value)) return value;
    } catch (_err) {
      // Ignore storage access errors in restricted contexts
    }
    return fallback;
  }

  function writeStoredPref(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (_err) {
      // Ignore storage access errors in restricted contexts
    }
  }

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

  function severityStyle(severity) {
    if (severity === "RED_EMERGENCY") {
      return { badge: "badge badge-red", card: "item-card item-card-red" };
    }
    if (severity === "YELLOW_PHC") {
      return { badge: "badge badge-yellow", card: "item-card item-card-yellow" };
    }
    return { badge: "badge badge-green", card: "item-card item-card-green" };
  }

  function formatHlc(hlc) {
    if (!hlc) return "--";
    return `${hlc.wall_ms}:${hlc.logical}:${hlc.node_id}`;
  }

  function buildPatientNameMap(patients) {
    const map = new Map();
    if (!Array.isArray(patients)) return map;
    for (const pat of patients) {
      if (pat && pat.patient_id && pat.full_name) {
        map.set(String(pat.patient_id), String(pat.full_name));
      }
    }
    return map;
  }

  function formatPatientLabel(patientId, nameMap) {
    if (!patientId) return "--";
    const idStr = String(patientId);
    const fullName = nameMap && nameMap.get(idStr);
    return fullName ? `${fullName} (${idStr})` : idStr;
  }

  function buildPatientHeadingNode(patientId, nameMap, fallbackId) {
    const idStr = patientId ? String(patientId) : "";
    const fullName = idStr && nameMap ? nameMap.get(idStr) : null;
    if (fullName) {
      return el(
        "span",
        { className: "item-card-title", title: formatPatientLabel(idStr, nameMap) },
        fullName,
        el("span", { className: "patient-id-sub mono" }, idStr)
      );
    }
    return el("span", { className: "item-card-title mono" }, idStr || fallbackId || "--");
  }

  function formatMoreCounter(remaining) {
    return t("moreCount").replace("{n}", String(remaining));
  }

  function translateSeverity(severity) {
    if (severity === "RED_EMERGENCY") return t("sevRed");
    if (severity === "YELLOW_PHC") return t("sevYellow");
    if (severity === "GREEN_HOME") return t("sevGreen");
    return severity || "--";
  }

  function translatePriority(priority) {
    if (priority === "CRITICAL") return t("prioCritical");
    if (priority === "HIGH") return t("prioHigh");
    if (priority === "MEDIUM") return t("prioMedium");
    if (priority === "LOW") return t("prioLow");
    return priority || t("prioMedium");
  }

  function translateActionStatus(status) {
    if (status === "OPEN") return t("statusOpen");
    if (status === "ACKNOWLEDGED") return t("statusAcknowledged");
    if (status === "COMPLETED") return t("statusCompleted");
    if (status === "DISMISSED") return t("statusDismissed");
    return status || t("statusOpen");
  }

  function translateRiskBand(band) {
    if (band === "RED_EMERGENCY") return t("sevRed");
    if (band === "YELLOW_PHC") return t("sevYellow");
    if (band === "GREEN_HOME") return t("sevGreen");
    if (band === "HIGH") return t("riskHigh");
    if (band === "MODERATE" || band === "MEDIUM") return t("riskModerate");
    if (band === "LOW") return t("riskLow");
    return band || t("riskEnriched");
  }

  function translateEnrichmentState(enrState) {
    if (enrState === "PENDING") return t("enrPending");
    if (enrState === "COMPLETED") return t("enrCompleted");
    if (enrState === "FAILED") return t("enrFailed");
    if (enrState === "NOT_NEEDED" || !enrState) return t("enrNotNeeded");
    return enrState;
  }

  function translateTier(tier) {
    if (tier === "TIER_0_WATCH") return t("tier0Label");
    if (tier === "TIER_1_PHONE") return t("tier1Label");
    if (tier === "TIER_2_HUB") return t("tier2Label");
    return tier || "";
  }

  function translateWatchMode(mode) {
    if (mode === "CHW_COMPANION") return t("watchModeChw");
    if (mode === "PATIENT_FAMILY") return t("watchModeFamily");
    return mode || "";
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
    setText("btn-toggle-events", state.eventsExpanded ? t("hideEventLog") : t("showEventLog"));

    const nodes = document.querySelectorAll("[data-i18n]");
    for (const node of nodes) {
      const key = node.getAttribute("data-i18n");
      if (key) node.textContent = t(key);
    }
    setText("btn-toggle-events", state.eventsExpanded ? t("hideEventLog") : t("showEventLog"));
  }

  function renderManifest(summary, connectInfo) {
    const manifest = summary && summary.manifest ? summary.manifest : null;
    if (manifest) {
      setText("manifest-node-id", manifest.node_id || "--");
      setText("arch-hub-node", manifest.node_id || "phc-hub-local");
      const ramGb = manifest.ram_mb ? `${Math.max(1, Math.round(manifest.ram_mb / 1024))} GB` : "32 GB";
      setText("arch-hub-ram", ramGb);
      setText("manifest-ram", manifest.ram_mb ? `${manifest.ram_mb} MB` : "--");
      setText("manifest-cpu", manifest.cpu_cores || "--");
      setText("manifest-npu", manifest.has_npu ? t("npuAvailable") : t("npuAbsent"));
    }

    if (summary && summary.latest_hlc) {
      setText("arch-hlc-badge", `HLC: ${formatHlc(summary.latest_hlc)}`);
    } else {
      setText("arch-hlc-badge", "HLC: --");
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
    setText("event-log-count", summary.event_count ?? 0);
  }

  function renderPatients(patients) {
    const container = document.getElementById("patients-list");
    if (!container) return;

    const list = Array.isArray(patients) ? patients : [];
    if (list.length === 0) {
      container.replaceChildren(el("p", { className: "empty-state" }, t("noPatients")));
      return;
    }

    const limit = 8;
    const cards = list.slice(0, limit).map((pat) => {
      const chips = [];
      if (pat.village_id) chips.push(el("span", { className: "meta-chip mono" }, pat.village_id));
      if (pat.is_pregnant) {
        const wk = pat.gestational_weeks ? ` · ${pat.gestational_weeks}w` : "";
        chips.push(el("span", { className: "meta-chip" }, `${t("pregnantWeeks")}${wk}`));
      }
      if (pat.metadata && typeof pat.metadata === "object") {
        for (const [k, v] of Object.entries(pat.metadata).slice(0, 3)) {
          chips.push(el("span", { className: "meta-chip mono" }, `${k}: ${String(v)}`));
        }
      }

      return el(
        "div",
        { className: "item-card" },
        el(
          "div",
          { className: "item-card-head" },
          el("span", { className: "item-card-title" }, pat.full_name || pat.patient_id),
          el("span", { className: "badge badge-brand mono" }, pat.patient_id)
        ),
        chips.length > 0 ? el("div", { className: "meta-chips" }, ...chips) : null
      );
    });
    if (list.length > limit) {
      cards.push(el("span", { className: "more-counter" }, formatMoreCounter(list.length - limit)));
    }
    container.replaceChildren(...cards);
  }

  function renderTriageHistory(summary, nameMap) {
    const container = document.getElementById("triage-list");
    if (!container) return;

    const history = summary && Array.isArray(summary.triage_history) ? summary.triage_history : [];
    const enrichmentTriages = [];
    if (summary && Array.isArray(summary.enrichments)) {
      for (const enr of summary.enrichments) {
        const ta = enr && enr.payload && enr.payload.triage_assessment;
        if (ta && typeof ta === "object" && ta.severity) {
          enrichmentTriages.push(ta);
        }
      }
    }
    const combined = [...history, ...enrichmentTriages].reverse();
    setText("triage-count-badge", combined.length);

    if (combined.length === 0) {
      container.replaceChildren(el("p", { className: "empty-state" }, t("noTriage")));
      return;
    }

    const limit = 6;
    const cards = combined.slice(0, limit).map((item) => {
      const style = severityStyle(item.severity);
      const rules = Array.isArray(item.matched_rules) ? item.matched_rules.join(", ") : "";
      return el(
        "div",
        { className: style.card },
        el(
          "div",
          { className: "item-card-head" },
          buildPatientHeadingNode(item.patient_id, nameMap, item.assessment_id),
          el("span", { className: style.badge }, translateSeverity(item.severity))
        ),
        item.rationale ? el("div", { className: "item-card-meta" }, item.rationale) : null,
        rules
          ? el("div", { className: "item-card-meta mono" }, rules)
          : null,
        item.referral_required
          ? el("div", { className: "meta-chips" }, el("span", { className: "badge badge-red" }, t("referralYes")))
          : null
      );
    });
    if (combined.length > limit) {
      cards.push(
        el("span", { className: "more-counter" }, formatMoreCounter(combined.length - limit))
      );
    }
    container.replaceChildren(...cards);
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

    const card0 = document.getElementById("arch-tier-0");
    const card1 = document.getElementById("arch-tier-1");
    if (card0) card0.classList.toggle("arch-tier-active", tier0 > 0);
    if (card1) card1.classList.toggle("arch-tier-active", tier1 > 0);

    if (list.length === 0) {
      container.replaceChildren(el("p", { className: "empty-state" }, t("noPeers")));
      return;
    }

    const cards = list.map((peer) => {
      const m = peer.manifest || peer;
      const nodeId = m.node_id || peer.node_id || "unknown-peer";
      const tier = m.tier || peer.tier || "PEER";
      const battery = m.battery_pct !== undefined ? `${t("battery")}: ${m.battery_pct}%` : "";
      const mode = m.watch_mode ? ` · ${translateWatchMode(m.watch_mode)}` : "";
      const source = peer.source ? ` · ${peer.source}` : "";
      const metaParts = [battery, mode, source].filter(Boolean).join(" ");

      return el(
        "div",
        { className: "item-card" },
        el(
          "div",
          { className: "item-card-head" },
          el("span", { className: "item-card-title mono" }, nodeId),
          el("span", { className: "badge badge-accent" }, translateTier(tier))
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
    setText("outbreak-count-badge", list.length);

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
      const village = p.village_id ? `${t("villagePrefix")} ${p.village_id}` : "EWMA";
      const detail = p.message || p.rationale || JSON.stringify(p);
      return el(
        "div",
        { className: "item-card item-card-red" },
        el(
          "div",
          { className: "item-card-head" },
          el("span", { className: "item-card-title" }, title),
          el("span", { className: "badge badge-red" }, village)
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

  function renderShap(enrichments, nameMap) {
    const container = document.getElementById("shap-list");
    if (!container) return;

    const list = Array.isArray(enrichments) ? enrichments : [];
    setText("shap-count-badge", list.length);
    if (list.length === 0) {
      container.replaceChildren(el("p", { className: "empty-state" }, t("noShap")));
      return;
    }

    const limit = 6;
    const cards = list.slice(0, limit).map((item) => {
      const entries = normalizeShapEntries(item.shap_attributions);
      const maxAbs = Math.max(0.01, ...entries.map((entry) => Math.abs(entry.value)));
      const scoreText =
        item.risk_score !== null && item.risk_score !== undefined
          ? `${t("riskScore")}: ${Number(item.risk_score).toFixed(2)}`
          : translateRiskBand(item.risk_band);

      const barNodes = entries.slice(0, 5).map((entry) => {
        const pct = Math.min(100, Math.round((Math.abs(entry.value) / maxAbs) * 100));
        const fillClass = entry.value >= 0 ? "shap-fill-pos" : "shap-fill-neg";
        const fill = el("div", { className: fillClass });
        fill.style.width = `${pct}%`;
        return el(
          "div",
          { className: "shap-bar-row" },
          el("span", { className: "mono shap-feature", title: entry.name }, entry.name),
          el("div", { className: "shap-track" }, fill),
          el("span", { className: "mono shap-val" }, (entry.value >= 0 ? "+" : "") + entry.value.toFixed(2))
        );
      });

      const badgeClass =
        item.risk_band === "RED_EMERGENCY" || item.risk_band === "HIGH"
          ? "badge badge-red"
          : "badge badge-yellow";

      return el(
        "div",
        { className: "item-card" },
        el(
          "div",
          { className: "item-card-head" },
          buildPatientHeadingNode(item.patient_id, nameMap, item.ref_event_id || item.event_id),
          el("span", { className: badgeClass }, scoreText)
        ),
        item.summary ? el("div", { className: "item-card-meta" }, item.summary) : null,
        ...barNodes
      );
    });
    if (list.length > limit) {
      cards.push(el("span", { className: "more-counter" }, formatMoreCounter(list.length - limit)));
    }
    container.replaceChildren(...cards);
  }

  function renderActionCards(cardsData, nameMap) {
    const container = document.getElementById("action-cards-list");
    if (!container) return;

    const list = Array.isArray(cardsData) ? cardsData : [];
    setText("action-count-badge", list.length);
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
      const cardClass =
        priority === "CRITICAL"
          ? "item-card item-card-red"
          : priority === "HIGH"
            ? "item-card item-card-yellow"
            : "item-card item-card-green";
      const targetLabel = card.target_tier ? ` → ${translateTier(card.target_tier)}` : "";

      return el(
        "div",
        { className: cardClass },
        el(
          "div",
          { className: "item-card-head" },
          el("span", { className: "item-card-title" }, card.title || card.card_id),
          el(
            "span",
            { className: badgeClass },
            `${translatePriority(priority)} · ${translateActionStatus(card.status || "OPEN")}`
          )
        ),
        el("div", { className: "item-card-meta" }, card.summary || ""),
        card.patient_id
          ? el(
              "div",
              { className: "item-card-meta", title: formatPatientLabel(card.patient_id, nameMap) },
              `${formatPatientLabel(card.patient_id, nameMap)}${targetLabel}`
            )
          : null
      );
    });
    container.replaceChildren(...cards);
  }

  function renderEvents(events, nameMap) {
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
      const eventKey = evt.event_id || formatHlc(evt.hlc);
      const isExpanded = state.expandedEventIds.has(eventKey);
      const compactPayload = JSON.stringify(evt.payload || {});
      const prettyPayload = JSON.stringify(evt.payload || {}, null, 2);

      let patientCell;
      if (evt.patient_id) {
        const pid = String(evt.patient_id);
        const fullName = nameMap && nameMap.get(pid);
        if (fullName) {
          patientCell = el(
            "td",
            { title: formatPatientLabel(pid, nameMap) },
            el("span", { className: "patient-cell-name" }, fullName),
            el("span", { className: "patient-cell-id mono" }, pid)
          );
        } else {
          patientCell = el("td", { className: "mono" }, pid);
        }
      } else {
        patientCell = el("td", { className: "mono" }, "--");
      }

      const payloadBtn = el(
        "button",
        {
          type: "button",
          className: isExpanded ? "payload-toggle mono expanded" : "payload-toggle mono",
          "aria-expanded": String(isExpanded),
          title: isExpanded ? t("collapsePayload") : t("expandPayload"),
        },
        isExpanded ? prettyPayload : compactPayload
      );
      payloadBtn.addEventListener("click", () => {
        if (state.expandedEventIds.has(eventKey)) {
          state.expandedEventIds.delete(eventKey);
        } else {
          state.expandedEventIds.add(eventKey);
        }
        renderEvents(state.lastEvents, buildPatientNameMap(state.lastSummary && state.lastSummary.patients));
      });

      return el(
        "tr",
        null,
        el("td", { className: "mono" }, formatHlc(evt.hlc)),
        el("td", { className: "mono" }, evt.origin_node_id || "--"),
        el("td", null, el("span", { className: "badge badge-accent" }, evt.event_type)),
        patientCell,
        el("td", null, el("span", { className: "badge" }, translateEnrichmentState(evt.enrichment_state))),
        el("td", { className: "payload-cell" }, payloadBtn)
      );
    });
    tbody.replaceChildren(...rows);
  }

  function renderScenarioNarrative() {
    const card = document.getElementById("scenario-narrative-card");
    if (!card) return;

    const info =
      state.activeScenario && !state.narrativeDismissed
        ? state.scenarioCatalog[state.activeScenario]
        : null;
    if (!info) {
      card.classList.add("hidden");
      card.replaceChildren();
      return;
    }

    const closeBtn = el(
      "button",
      { type: "button", className: "btn btn-secondary btn-dismiss", "aria-label": t("dismiss") },
      t("dismiss")
    );
    closeBtn.addEventListener("click", () => {
      state.narrativeDismissed = true;
      renderScenarioNarrative();
    });

    const stepNodes = Array.isArray(info.steps)
      ? info.steps.map((step) => el("li", null, String(step)))
      : [];

    card.classList.remove("hidden");
    card.replaceChildren(
      el(
        "div",
        { className: "scenario-narrative-head" },
        el(
          "div",
          { className: "scenario-narrative-title-group" },
          el("h3", { className: "scenario-narrative-title" }, info.title || info.id),
          info.persona ? el("span", { className: "badge badge-accent" }, info.persona) : null
        ),
        closeBtn
      ),
      info.subtitle ? el("p", { className: "scenario-narrative-sub" }, info.subtitle) : null,
      stepNodes.length > 0 ? el("span", { className: "scenario-steps-label" }, t("scenarioStepsLabel")) : null,
      stepNodes.length > 0 ? el("ol", { className: "scenario-steps" }, ...stepNodes) : null
    );
  }

  async function loadScenarioCatalog() {
    const catalog = await fetchJsonSafe("/api/v1/demo/scenarios");
    if (!Array.isArray(catalog)) return;
    const byId = {};
    for (const item of catalog) {
      if (item && item.id) {
        byId[String(item.id)] = item;
      }
    }
    state.scenarioCatalog = byId;
    renderScenarioNarrative();
  }

  function showDemoStatus(message, meta) {
    const banner = document.getElementById("demo-status-banner");
    if (!banner) return;
    banner.classList.remove("hidden");
    banner.replaceChildren(
      el("span", null, message),
      meta ? el("span", { className: "badge badge-brand mono" }, meta) : null
    );
  }

  function updateScenarioButtons() {
    const buttons = document.querySelectorAll("[data-scenario]");
    for (const btn of buttons) {
      const sid = btn.getAttribute("data-scenario");
      btn.classList.toggle("active", sid === state.activeScenario);
    }
  }

  async function runScenario(scenarioId) {
    const buttons = document.querySelectorAll("[data-scenario], #btn-demo-reset");
    for (const b of buttons) b.disabled = true;
    showDemoStatus(t("demoLoading"), scenarioId);
    try {
      const res = await fetch(`/api/v1/demo/load/${encodeURIComponent(scenarioId)}`, {
        method: "POST",
      });
      if (!res.ok) {
        showDemoStatus(t("demoUnavailable"), String(res.status));
        return;
      }
      const data = await res.json();
      state.activeScenario = scenarioId;
      state.narrativeDismissed = false;
      updateScenarioButtons();
      renderScenarioNarrative();
      const meta = `${data.events_added ?? 0} ${t("eventsUnit")} · ${data.peers_registered ?? 0} ${t("peersUnit")}`;
      showDemoStatus(`${t("demoLoaded")} ${scenarioId}`, meta);
      await refreshAll();
    } catch (_err) {
      showDemoStatus(t("demoUnavailable"), null);
    } finally {
      for (const b of buttons) b.disabled = false;
    }
  }

  async function resetDemo() {
    const buttons = document.querySelectorAll("[data-scenario], #btn-demo-reset");
    for (const b of buttons) b.disabled = true;
    showDemoStatus(t("demoResetting"), null);
    try {
      const res = await fetch("/api/v1/demo/reset", { method: "POST" });
      if (!res.ok) {
        showDemoStatus(t("demoUnavailable"), String(res.status));
        return;
      }
      state.activeScenario = null;
      state.narrativeDismissed = false;
      state.expandedEventIds.clear();
      updateScenarioButtons();
      renderScenarioNarrative();
      showDemoStatus(t("demoResetDone"), `0 ${t("eventsUnit")}`);
      await refreshAll();
    } catch (_err) {
      showDemoStatus(t("demoUnavailable"), null);
    } finally {
      for (const b of buttons) b.disabled = false;
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
    const patients = state.lastSummary ? state.lastSummary.patients : [];
    const nameMap = buildPatientNameMap(patients);
    applyTranslations();
    renderScenarioNarrative();
    renderManifest(state.lastSummary, state.lastConnectInfo);
    renderKpis(state.lastSummary);
    renderPatients(patients);
    renderTriageHistory(state.lastSummary, nameMap);
    renderPeers(state.lastPeers);
    renderOutbreaks(state.lastSummary ? state.lastSummary.outbreak_alerts : []);
    renderShap(state.lastSummary ? state.lastSummary.enrichments : [], nameMap);
    renderActionCards(state.lastSummary ? state.lastSummary.action_cards : [], nameMap);
    renderEvents(state.lastEvents, nameMap);
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
        writeStoredPref(STORAGE_LANG_KEY, state.lang);
        renderAll();
      });
    }

    const themeBtn = document.getElementById("btn-theme");
    if (themeBtn) {
      themeBtn.addEventListener("click", () => {
        state.theme = state.theme === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", state.theme);
        writeStoredPref(STORAGE_THEME_KEY, state.theme);
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

    const toggleEventsBtn = document.getElementById("btn-toggle-events");
    const eventsCollapsible = document.getElementById("events-collapsible");

    const filterSelect = document.getElementById("event-type-filter");
    if (filterSelect) {
      filterSelect.addEventListener("change", (ev) => {
        state.selectedEventType = ev.target.value || "";
        if (!state.eventsExpanded) {
          state.eventsExpanded = true;
          if (eventsCollapsible) eventsCollapsible.classList.remove("hidden");
          if (toggleEventsBtn) {
            toggleEventsBtn.setAttribute("aria-expanded", "true");
            toggleEventsBtn.textContent = t("hideEventLog");
          }
        }
        refreshAll();
      });
    }

    if (toggleEventsBtn && eventsCollapsible) {
      toggleEventsBtn.addEventListener("click", () => {
        state.eventsExpanded = !state.eventsExpanded;
        eventsCollapsible.classList.toggle("hidden", !state.eventsExpanded);
        toggleEventsBtn.setAttribute("aria-expanded", String(state.eventsExpanded));
        toggleEventsBtn.textContent = state.eventsExpanded ? t("hideEventLog") : t("showEventLog");
      });
    }

    const scenarioBtns = document.querySelectorAll("[data-scenario]");
    for (const btn of scenarioBtns) {
      btn.addEventListener("click", () => {
        const sid = btn.getAttribute("data-scenario");
        if (sid) runScenario(sid);
      });
    }

    const resetBtn = document.getElementById("btn-demo-reset");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        resetDemo();
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    state.lang = readStoredPref(STORAGE_LANG_KEY, ["en", "hi"], "en");
    state.theme = readStoredPref(STORAGE_THEME_KEY, ["dark", "light"], "dark");
    document.documentElement.setAttribute("data-theme", state.theme);
    bindEvents();
    applyTranslations();
    loadScenarioCatalog();
    refreshAll();
    syncAutoRefreshTimer();
  });
})();
