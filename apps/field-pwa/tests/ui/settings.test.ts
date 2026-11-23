import { describe, expect, it } from "vitest";
import { DEFAULT_HUB_URL, hubOriginFrom, isLoopbackHost, resolveHubUrl, type LocLike } from "../../src/ui/settings";

const loc = (href: string): LocLike => {
  const u = new URL(href);
  return { protocol: u.protocol, host: u.host, hostname: u.hostname, pathname: u.pathname };
};
const LAN = loc("http://192.168.1.5:8000/phone/");
const DEV = loc("http://localhost:5173/");

describe("hubOriginFrom", () => {
  it("returns the origin on the /phone/ mount", () => {
    expect(hubOriginFrom(LAN)).toBe("http://192.168.1.5:8000");
  });
  it("accepts /phone and /phone/index.html", () => {
    expect(hubOriginFrom(loc("http://192.168.1.5:8000/phone"))).toBe("http://192.168.1.5:8000");
    expect(hubOriginFrom(loc("http://192.168.1.5:8000/phone/index.html"))).toBe("http://192.168.1.5:8000");
  });
  it("handles https without a port", () => {
    expect(hubOriginFrom(loc("https://hub.example/phone/"))).toBe("https://hub.example");
  });
  it("keeps IPv6 brackets", () => {
    expect(hubOriginFrom(loc("http://[fe80::1]:8000/phone/"))).toBe("http://[fe80::1]:8000");
  });
  it("is null for dev servers", () => {
    expect(hubOriginFrom(DEV)).toBeNull();
    expect(hubOriginFrom(loc("http://127.0.0.1:5173/index.html"))).toBeNull();
  });
  it("is null for other paths", () => {
    expect(hubOriginFrom(loc("http://127.0.0.1:8000/apps/field-pwa/index.html"))).toBeNull();
    expect(hubOriginFrom(loc("http://192.168.1.5:8000/phoneX/"))).toBeNull();
    expect(hubOriginFrom(loc("http://192.168.1.5:8000/x/phone/"))).toBeNull();
  });
  it("is null for file:, null and undefined", () => {
    expect(hubOriginFrom({ protocol: "file:", host: "", hostname: "", pathname: "/phone/index.html" })).toBeNull();
    expect(hubOriginFrom(null)).toBeNull();
    expect(hubOriginFrom(undefined)).toBeNull();
  });
});

describe("resolveHubUrl", () => {
  it("a saved override wins", () => {
    expect(resolveHubUrl("http://10.0.0.9:9000", LAN)).toBe("http://10.0.0.9:9000");
    expect(resolveHubUrl("http://10.0.0.9:9000", DEV)).toBe("http://10.0.0.9:9000");
  });
  it("falls back to origin, then default", () => {
    expect(resolveHubUrl(null, LAN)).toBe("http://192.168.1.5:8000");
    expect(resolveHubUrl(null, DEV)).toBe(DEFAULT_HUB_URL);
    expect(resolveHubUrl(null, null)).toBe(DEFAULT_HUB_URL);
  });
  it("ignores a stale loopback value on a non-loopback hub origin", () => {
    expect(resolveHubUrl("http://127.0.0.1:8000", LAN)).toBe("http://192.168.1.5:8000");
    expect(resolveHubUrl("http://localhost:8000", LAN)).toBe("http://192.168.1.5:8000");
  });
  it("keeps a loopback value on desktop and on dev", () => {
    expect(resolveHubUrl("http://127.0.0.1:8000", loc("http://127.0.0.1:8000/phone/"))).toBe("http://127.0.0.1:8000");
    expect(resolveHubUrl("http://127.0.0.1:8000", DEV)).toBe("http://127.0.0.1:8000");
  });
  it("treats empty or whitespace as unset", () => {
    expect(resolveHubUrl("", LAN)).toBe("http://192.168.1.5:8000");
    expect(resolveHubUrl("   ", DEV)).toBe(DEFAULT_HUB_URL);
  });
});

describe("isLoopbackHost", () => {
  it("detects loopback", () => {
    for (const h of ["127.0.0.1", "127.1.2.3", "localhost", "::1", "[::1]"]) expect(isLoopbackHost(h)).toBe(true);
  });
  it("rejects LAN addresses", () => {
    expect(isLoopbackHost("192.168.1.5")).toBe(false);
    expect(isLoopbackHost("10.0.0.1")).toBe(false);
  });
});
