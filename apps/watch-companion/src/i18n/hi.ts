import type { Key } from "./en";

/** Pure Shuddh Tatsama Hindi UI strings. Must have exact key parity with en.ts; zero Perso-Arabic, Hinglish, or nukta (U+093C). */
export const hi: Record<Key, string> = {
  "app.title": "आरोग्य सहचर",
  "lang.toggle": "EN",

  "mode.CHW_COMPANION": "स्वास्थ्य कर्मी",
  "mode.PATIENT_FAMILY": "परिवार",
  "mode.full.CHW_COMPANION": "स्वास्थ्य कर्मी सहचर",
  "mode.full.PATIENT_FAMILY": "रोगी / परिवार",

  "net.online": "संजाल युक्त",
  "net.offline": "संजाल रहित",

  "tab.danger": "संकट",
  "tab.cards": "सूचना",
  "tab.reminders": "स्मरण",
  "tab.sos": "आपात",
  "tab.sync": "समन्वय",

  "danger.title": "तत्काल संकट परीक्षण",
  "danger.subtitle": "उपस्थित संकट लक्षण चुनें",
  "danger.patientId": "रोगी क्रमांक (वैकल्पिक)",
  "danger.anon": "अपंजीकृत रोगी",
  "danger.submit": "संकट परीक्षण करें",
  "danger.reset": "पुनः आरम्भ",
  "danger.redTitle": "लाल - आपातकाल",
  "danger.redBanner": "108 रोगी वाहन · तत्काल चिकित्सालय भेजें",
  "danger.greenTitle": "हरित - गृह परिचर्या",
  "danger.greenBanner": "संकट लक्षण नहीं · गृह परिचर्या",
  "danger.call108": "108 पर दूरभाष करें",

  "sign.unableDrink": "पान अथवा स्तनपान में अक्षम",
  "sign.vomitsAll": "प्रत्येक बार वमन",
  "sign.convulsions": "आक्षेप",
  "sign.lethargic": "निश्चेत अथवा अत्यधिक शिथिल",
  "sign.bleeding": "अत्यधिक रक्तस्राव",

  "cards.title": "कार्य सूचनाएँ",
  "cards.empty": "कोई सक्रिय कार्य सूचना नहीं है।",
  "cards.ack": "स्वीकृत करें",
  "cards.acked": "स्वीकृत",
  "cards.due": "देय: {date}",

  "priority.CRITICAL": "अत्यन्त गम्भीर",
  "priority.HIGH": "उच्च",
  "priority.MEDIUM": "मध्यम",
  "priority.LOW": "न्यून",

  "rem.title": "स्वास्थ्य स्मरण",
  "rem.empty": "कोई देय टीकाकरण अथवा औषधि नहीं है।",
  "rem.vaccines": "टीकाकरण",
  "rem.medicines": "औषधि एवं परिचर्या",
  "rem.OVERDUE": "विलम्बित",
  "rem.DUE_SOON": "शीघ्र देय",
  "rem.UPCOMING": "आगामी",
  "rem.COMPLETED": "पूर्ण",

  "sos.title": "आपातकालीन सहायता",
  "sos.guidance108": "आपातकाल में 108 रोगी वाहन बुलाएँ अथवा प्राथमिक स्वास्थ्य केन्द्र जाएँ।",
  "sos.recordStart": "ध्वनि संदेश आरम्भ करें",
  "sos.recordStop": "रोकें एवं सुरक्षित करें",
  "sos.recording": "ध्वनि अंकन ({sec})...",
  "sos.textPlaceholder": "आपातकालीन स्थिति लिखें...",
  "sos.sendText": "लिखित सहायता भेजें",
  "sos.queued": "आपातकालीन संदेश स्थानीय संचयन में सुरक्षित (केन्द्र विश्लेषण हेतु प्रतीक्षित)।",
  "sos.micUnavailable": "ध्वनि ग्राह्य अनुपलब्ध · लिखित सहायता भेजें",

  "sync.title": "केन्द्र समन्वय",
  "sync.hubLabel": "स्वास्थ्य केन्द्र संकेत",
  "sync.hubHint": "http://127.0.0.1:8000",
  "sync.now": "समन्वय करें",
  "sync.syncing": "समन्वय प्रगति पर...",
  "sync.queued": "{count} प्रतीक्षित",
  "sync.success": "समन्वय पूर्ण ({sent} प्रेषित, {received} प्राप्त)",
  "sync.offlineFail": "केन्द्र अनुपलब्ध · स्थानीय संचयन सुरक्षित",
  "sync.footer": "संगी उपकरण · {count} प्रतीक्षित",
};
