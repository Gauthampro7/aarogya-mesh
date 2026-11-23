import { describe, expect, it } from "vitest";
import { en } from "../../src/i18n/en";
import { hi } from "../../src/i18n/hi";
import { getLang, setLang, t, toggleLang } from "../../src/i18n/index";

const DENY_WORDS = [
  // Perso-Arabic / colloquial loanwords forbidden by Pure Indigenous Indic Vocabulary Rule
  "अस्पताल", "दवा", "दवाई", "दवाख़ाना", "दवाखाना", "बुख़ार", "बुखार", "तकलीफ़", "तकलीफ", "ख़तरा", "खतरा",
  "मरीज़", "मरीज", "इलाज", "सलाह", "ज़रूरी", "जरूरी", "मदद", "ख़ून", "खून", "कमज़ोरी", "कमजोरी",
  "डॉक्टर", "डाक्टर", "एम्बुलेंस", "एंबुलेंस", "फ़ोन", "फोन", "तारीख", "तारीख़", "वापस", "शुरू", "शुरुआत",
  "बंद", "रद्द", "ज़्यादा", "ज्यादा", "साल", "सिर्फ", "सिर्फ़", "ख़त्म", "खत्म", "इस्तेमाल", "कोशिश", "ज़िला", "जिला",
  "ख़बर", "खबर", "वक़्त", "वक्त", "हफ़्ता", "हफ्ता", "बीमारी", "सेहत", "सुबह", "शाम", "जल्दी", "ज़रा",
  // Hinglish / transliterated English words
  "मोबाइल", "ऑफलाइन", "ऑफ़लाइन", "ऑनलाइन", "बटन", "सिंक", "रिकॉर्ड", "रिकार्ड", "कार्ड", "नेटवर्क", "हब",
  "सर्वर", "ऐप", "एप्प", "ट्राइएज", "ट्रायज", "मेनू", "सेव", "चेकलिस्ट", "वैक्सीन", "ऑक्सीजन",
  "वॉइस", "नोट", "रजिस्टर", "रजिस्ट्रेशन", "अलर्ट", "स्क्रीन", "वॉच", "इमरजेंसी", "सेकंड", "सेकण्ड",
];

// Nukta characters (decompose to base + U+093C): ख़ ग़ ज़ फ़ ड़ ढ़ क़
const NUKTA_CHARS = ["ख़", "ग़", "ज़", "फ़", "ड़", "ढ़", "क़"];

describe("watch-companion i18n tables", () => {
  it("have identical key sets between en and hi", () => {
    expect(Object.keys(hi).sort()).toEqual(Object.keys(en).sort());
  });

  it("have non-empty strings and matching {placeholders}", () => {
    const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(",");
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(en[key].length, key).toBeGreaterThan(0);
      expect(hi[key].length, key).toBeGreaterThan(0);
      expect(placeholders(hi[key]), key).toBe(placeholders(en[key]));
    }
  });

  it("Hindi contains zero deny-listed Perso-Arabic or Hinglish words", () => {
    for (const [key, value] of Object.entries(hi)) {
      const words = value.split(/[^\u0900-\u097F]+/).filter(Boolean);
      for (const bad of DENY_WORDS) {
        expect(words, `${key} contains forbidden word "${bad}"`).not.toContain(bad);
      }
    }
  });

  it("Hindi contains zero nukta characters (U+093C) in NFC or NFD", () => {
    for (const [key, value] of Object.entries(hi)) {
      for (const n of NUKTA_CHARS) {
        expect(value, `${key} contains nukta char ${n}`).not.toContain(n);
        expect(value.normalize("NFC"), `${key} NFC contains ${n}`).not.toContain(n.normalize("NFC"));
      }
      expect(value.normalize("NFD"), `${key} contains U+093C nukta`).not.toContain("\u093c");
    }
  });

  it("Hindi strings use Devanagari (Latin allowed only for lang.toggle, sync.hubHint, 108, and {placeholders})", () => {
    const allowedLatinKeys = new Set(["lang.toggle", "sync.hubHint"]);
    for (const [key, value] of Object.entries(hi)) {
      if (allowedLatinKeys.has(key)) continue;
      const stripped = value.replace(/\{\w+\}|108/g, "");
      expect(stripped, `${key} contains unexpected Latin letters`).not.toMatch(/[A-Za-z]/);
    }
  });

  it("uses mandated Shuddh Tatsama referral and clinical vocabulary", () => {
    expect(hi["danger.redBanner"]).toContain("चिकित्सालय भेजें");
    expect(hi["danger.redBanner"]).toContain("रोगी वाहन");
    expect(hi["tab.sync"]).toBe("समन्वय");
    expect(hi["rem.vaccines"]).toBe("टीकाकरण");
  });

  it("supports language switching and variable interpolation", () => {
    setLang("en");
    expect(getLang()).toBe("en");
    expect(t("sync.queued", { count: 3 })).toBe("3 queued");

    expect(toggleLang()).toBe("hi");
    expect(getLang()).toBe("hi");
    expect(t("sync.queued", { count: 3 })).toBe("3 प्रतीक्षित");

    setLang("en");
  });
});
