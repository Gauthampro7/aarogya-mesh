import { describe, expect, it } from "vitest";
import { cardPatientLabel } from "../../src/ui/sync_logic";

describe("cardPatientLabel", () => {
  const patients = new Map([["p1", { full_name: "Asha Devi", village_id: "V1" }]]);
  it("returns null for a null patient id", () => {
    expect(cardPatientLabel(null, patients)).toBeNull();
  });
  it("resolves a known patient to name and village", () => {
    expect(cardPatientLabel("p1", patients)).toEqual({ name: "Asha Devi", village: "V1" });
  });
  it("falls back to the raw id for an unknown patient", () => {
    expect(cardPatientLabel("p2", patients)).toEqual({ name: "p2", village: null });
  });
  it("falls back to the raw id with an empty map", () => {
    expect(cardPatientLabel("p1", new Map())).toEqual({ name: "p1", village: null });
  });
});
