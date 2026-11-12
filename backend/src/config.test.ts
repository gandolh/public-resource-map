import { describe, expect, it } from "vitest";
import { ConfigError, loadConfig, loadDatabaseConfig, loadSeedConfig } from "./config.js";

const ORIGIN = { PUBLIC_ORIGIN: "https://example.com" };

describe("loadConfig", () => {
  it("fills the defaults, and treats an empty value as unset", () => {
    const config = loadConfig({ ...ORIGIN, PORT: "", HOST: " ", AUTH_TRUSTED_PROXIES: "" });
    expect(config).toMatchObject({
      host: "0.0.0.0",
      port: 3001,
      corsOrigin: "http://localhost:5173",
      production: false,
      publicOrigin: "https://example.com",
      appBase: "/prm/",
      trustedProxies: [],
      nominatimUserAgent: undefined,
      overpassUrl: "https://overpass-api.de/api/interpreter",
      ward: undefined,
    });
    expect(config.databasePath).toMatch(/backend\/data\/app\.db$/);
  });

  it("throws once, naming every bad variable, PUBLIC_ORIGIN included", () => {
    expect(() => loadConfig({ PORT: "abc" })).toThrow(ConfigError);
    try {
      loadConfig({ PORT: "abc" });
    } catch (error) {
      expect(String(error)).toMatch(/PORT/);
      expect(String(error)).toMatch(/PUBLIC_ORIGIN is not set/);
    }
  });

  it("reads NODE_ENV only as the production flag", () => {
    expect(loadConfig({ ...ORIGIN, NODE_ENV: "production" }).production).toBe(true);
    expect(loadConfig({ ...ORIGIN, NODE_ENV: "development" }).production).toBe(false);
  });

  it("splits the trusted proxies and ends the base path in a slash", () => {
    const config = loadConfig({ ...ORIGIN, AUTH_TRUSTED_PROXIES: "172.16.0.0/12, 127.0.0.1", PRM_BASE: "/map" });
    expect(config.trustedProxies).toEqual(["172.16.0.0/12", "127.0.0.1"]);
    expect(config.appBase).toBe("/map/");
  });

  it("links into prm under its public origin unless APP_URL says otherwise", () => {
    expect(loadConfig({ PUBLIC_ORIGIN: "https://example.com/" }).appUrl).toBe("https://example.com/prm");
    expect(loadConfig({ ...ORIGIN, APP_URL: "http://localhost:5173/prm/" }).appUrl).toBe("http://localhost:5173/prm");
  });

  it("refuses a Ward set that is half there", () => {
    expect(() => loadConfig({ ...ORIGIN, WARD_OIDC_ISSUER: "https://ward.example/oidc" })).toThrow(
      /WARD_OIDC_CLIENT_ID/,
    );
  });
});

describe("the scripts' settings", () => {
  it("need no PUBLIC_ORIGIN", () => {
    expect(loadDatabaseConfig({ DATABASE_PATH: "/srv/prm/app.db" })).toEqual({
      databasePath: "/srv/prm/app.db",
      production: false,
    });
    expect(loadSeedConfig({ NODE_ENV: "production", SEED_ROLE: " admin " })).toMatchObject({
      production: true,
      seedRole: "admin",
      demoUsername: undefined,
    });
  });
});
