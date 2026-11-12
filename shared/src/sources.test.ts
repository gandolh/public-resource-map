import { describe, expect, it } from "vitest";
import { renderDataSources } from "./data-sources.js";
import { SOURCES, hostMatches, publisherForUrl, sourceById } from "./sources.js";

describe("the source registry", () => {
  it("has one entry per id, each kebab-case", () => {
    const ids = SOURCES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("names hosts without a scheme or www", () => {
    for (const s of SOURCES) expect(s.host).toMatch(/^(?!www\.)[a-z0-9-]+(\.[a-z0-9-]+)+$/);
  });

  it("calls nothing permitted that nobody checked", () => {
    for (const s of SOURCES) {
      if (s.termsCheckedOn === null) expect(s.reuse, s.id).not.toBe("permitted");
      else expect(s.termsCheckedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("credits in both languages, with a link", () => {
    for (const s of SOURCES) {
      expect(s.attribution.ro.trim(), s.id).not.toBe("");
      expect(s.attribution.en.trim(), s.id).not.toBe("");
      expect(s.attributionUrl).toMatch(/^https:\/\//);
    }
  });

  it("keeps iaBilet forbidden, as the legal posture says", () => {
    expect(sourceById("iabilet")?.reuse).toBe("forbidden");
  });
});

describe("publisherForUrl", () => {
  it("ties a feed to its publisher by host, www or not", () => {
    expect(publisherForUrl("https://www.tntm.ro/?ical=1")?.id).toBe("teatrul-national-timisoara");
    expect(publisherForUrl("https://filarmonicabanatul.ro/evenimente/?ical=1")?.id).toBe("filarmonica-banatul");
  });

  it("finds nothing for an unknown host, no URL, or a host that only ends the same way", () => {
    expect(publisherForUrl("https://example.org/feed.ics")).toBeUndefined();
    expect(publisherForUrl(null)).toBeUndefined();
    expect(publisherForUrl("https://nottntm.ro/feed")).toBeUndefined();
    expect(hostMatches("events.tntm.ro", "tntm.ro")).toBe(true);
  });

  it("matches event publishers only", () => {
    expect(publisherForUrl("https://nominatim.openstreetmap.org/search")).toBeUndefined();
  });
});

describe("renderDataSources", () => {
  it("carves out every source that is not permitted, and only those", () => {
    const text = renderDataSources();
    for (const s of SOURCES) {
      expect(text.includes(`### ${s.name} (\`${s.id}\`)`), s.id).toBe(s.reuse !== "permitted");
    }
  });

  it("lists every source in the table", () => {
    const text = renderDataSources();
    for (const s of SOURCES) expect(text).toContain(`| ${s.name} (\`${s.id}\`) |`);
  });
});
