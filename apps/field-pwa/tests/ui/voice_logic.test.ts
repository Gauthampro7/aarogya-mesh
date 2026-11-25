import { afterEach, describe, expect, it, vi } from "vitest";
import { formatDurationMmSs, recordingUnavailableReason } from "../../src/ui/voice_logic";

afterEach(() => vi.unstubAllGlobals());

describe("formatDurationMmSs", () => {
  it("formats MM:SS and lets minutes grow past 59", () => {
    expect(formatDurationMmSs(0)).toBe("00:00");
    expect(formatDurationMmSs(999)).toBe("00:00");
    expect(formatDurationMmSs(65_000)).toBe("01:05");
    expect(formatDurationMmSs(3_600_000)).toBe("60:00");
    expect(formatDurationMmSs(3_725_000)).toBe("62:05");
  });
  it("clamps negative and non-finite input to 00:00", () => {
    expect(formatDurationMmSs(-5)).toBe("00:00");
    expect(formatDurationMmSs(Number.NaN)).toBe("00:00");
    expect(formatDurationMmSs(Number.POSITIVE_INFINITY)).toBe("00:00");
  });
});

describe("recordingUnavailableReason", () => {
  const rec = () => undefined;
  const apis = { MediaRecorder: rec, navigator: { mediaDevices: { getUserMedia: rec } } };

  it("insecure context wins even when the APIs exist", () => {
    expect(recordingUnavailableReason({ isSecureContext: false, ...apis })).toBe("insecure_context");
  });
  it("insecure context with nothing else is insecure_context", () => {
    expect(recordingUnavailableReason({ isSecureContext: false })).toBe("insecure_context");
  });
  it("secure without MediaRecorder is unsupported", () => {
    expect(recordingUnavailableReason({ isSecureContext: true, navigator: apis.navigator })).toBe("unsupported");
  });
  it("secure with MediaRecorder but no mediaDevices is unsupported", () => {
    expect(recordingUnavailableReason({ isSecureContext: true, MediaRecorder: rec, navigator: {} })).toBe("unsupported");
  });
  it("all present is null", () => {
    expect(recordingUnavailableReason({ isSecureContext: true, ...apis })).toBeNull();
  });
  it("undefined isSecureContext with all APIs is null", () => {
    expect(recordingUnavailableReason({ ...apis })).toBeNull();
  });
  it("defaults to globalThis", () => {
    vi.stubGlobal("isSecureContext", false);
    expect(recordingUnavailableReason()).toBe("insecure_context");
  });
});
