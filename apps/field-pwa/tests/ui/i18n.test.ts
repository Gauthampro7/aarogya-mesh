import { describe, expect, it } from "vitest";
import { en } from "../../src/i18n/en";
import { hi } from "../../src/i18n/hi";
import { dehydrationFlags, maternalRedOptions, pediatricDangerOptions } from "../../src/ui/triage_map";

const DENY = [
  // Perso-Arabic / colloquial words to avoid
  "अस्पताल", "दवा", "दवाई", "दवाख़ाना", "दवाखाना", "बुख़ार", "बुखार", "तकलीफ़", "तकलीफ", "ख़तरा", "खतरा",
  "मरीज़", "मरीज", "इलाज", "सलाह", "ज़रूरी", "जरूरी", "मदद", "ख़ून", "खून", "कमज़ोरी", "कमजोरी",
  "डॉक्टर", "डाक्टर", "एम्बुलेंस", "एंबुलेंस", "फ़ोन", "फोन", "तारीख", "तारीख़", "वापस", "शुरू", "शुरुआत",
  "बंद", "रद्द", "ज़्यादा", "ज्यादा", "साल", "सिर्फ", "ख़त्म", "खत्म", "इस्तेमाल", "कोशिश", "ज़िला", "जिला",
  "ख़बर", "खबर", "वक़्त", "वक्त", "हफ़्ता", "हफ्ता", "बीमारी", "सेहत", "सुबह", "शाम", "जल्दी", "ज़रा",
  // Hinglish / transliterated English
  "मोबाइल", "ऑफलाइन", "ऑफ़लाइन", "ऑनलाइन", "बटन", "सिंक", "रिकॉर्ड", "रिकार्ड", "कार्ड", "नेटवर्क", "हब",
  "सर्वर", "ऐप", "एप्प", "ट्राइएज", "ट्रायज", "मेनू", "सेव", "चेकलिस्ट", "वैक्सीन", "टीका-कार्ड", "ऑक्सीजन",
  "हीमोग्लोबिन", "टेम्परेचर", "वॉइस", "नोट", "रजिस्टर", "रजिस्ट्रेशन", "ट्रिपल",
];
// Nukta letters (decompose to base + U+093C): ख़ ग़ ज़ फ़ ड़ ढ़ क़
const NUKTA = ["ख़", "ग़", "ज़", "फ़", "ड़", "ढ़", "क़"];

describe("i18n tables", () => {
  it("have identical key sets", () => {
    expect(Object.keys(hi).sort()).toEqual(Object.keys(en).sort());
  });

  it("have no empty strings and matching {placeholders}", () => {
    const ph = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(",");
    for (const k of Object.keys(en) as (keyof typeof en)[]) {
      expect(en[k].length, k).toBeGreaterThan(0);
      expect(hi[k].length, k).toBeGreaterThan(0);
      expect(ph(hi[k]), k).toBe(ph(en[k]));
    }
  });

  it("Hindi contains no deny-listed Perso-Arabic or Hinglish words", () => {
    for (const [k, v] of Object.entries(hi)) {
      // Whole-word match (so e.g. "साल" does not flag "चिकित्सालय").
      const words = v.split(/[^\u0900-\u097F]+/).filter(Boolean);
      for (const bad of DENY) {
        expect(words, `${k} contains ${bad}`).not.toContain(bad);
        if (bad.includes(" ")) expect(v).not.toContain(bad);
      }
    }
  });

  it("Hindi contains no nukta letters (Perso-Arabic spellings), in any Unicode form", () => {
    for (const [k, v] of Object.entries(hi)) {
      for (const n of NUKTA) {
        expect(v, `${k} has ${n}`).not.toContain(n);
        expect(v.normalize("NFC"), `${k} has ${n}`).not.toContain(n.normalize("NFC"));
      }
      expect(v.normalize("NFD"), `${k} has a nukta`).not.toContain("़");
    }
  });

  it("Hindi strings are Devanagari (Latin allowed only for units, URLs and the language toggle)", () => {
    const allowed = new Set(["lang.switch", "sync.hubHint"]);
    for (const [k, v] of Object.entries(hi)) {
      if (allowed.has(k as never)) continue;
      const stripped = v.replace(/\(°C\)|\(%\)|\(g\/dL\)|\(cm\)|\{\w+\}|108/g, "");
      expect(stripped, k).not.toMatch(/[A-Za-z]/);
    }
  });

  it("the Hindi referral wording uses the mandated vocabulary", () => {
    expect(hi["ref.red"]).toContain("चिकित्सालय भेजें");
    expect(hi["sev.call108"]).toContain("रोगी वाहन");
  });

  it("every canonical rule-table-driven key exists (dehydration labels, checklist titles)", () => {
    for (const f of dehydrationFlags()) expect(`dehy.${f}` in en, f).toBe(true);
    for (const c of ["anc_trimester_1", "anc_trimester_2", "anc_trimester_3", "pnc_mother", "pnc_newborn"]) {
      expect(`ck.${c}` in en, c).toBe(true);
    }
    expect(pediatricDangerOptions().length).toBeGreaterThan(5);
    expect(maternalRedOptions().length).toBeGreaterThan(5);
  });
});
