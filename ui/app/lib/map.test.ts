import { describe, expect, it } from "vitest";
import { creditHtml, mapCredits, placeUrl, publishersOf } from "./map";

describe("placeUrl", () => {
  it("keeps the deployed base path", () => {
    expect(placeUrl("abc", "https://example.org", "/prm/")).toBe("https://example.org/prm/places/abc");
  });

  it("works at the root in dev", () => {
    expect(placeUrl(42, "http://localhost:5173", "/")).toBe("http://localhost:5173/places/42");
  });
});

describe("the map's credits, from the source registry", () => {
  it("name OpenStreetMap with its licence, linked, as the OSM Foundation asks", () => {
    const [osm] = mapCredits("ro");
    expect(osm).toContain('href="https://www.openstreetmap.org/copyright"');
    expect(osm).toContain(">© OpenStreetMap contributors</a>");
    expect(osm).toContain(
      '(<a href="https://opendatacommons.org/licenses/odbl/" target="_blank" rel="noreferrer">ODbL 1.0</a>)',
    );
  });

  it("name the tiles once: the OSM tiles' credit is OpenStreetMap's", () => {
    // No CARTO key in the tests, so the tiles are OpenStreetMap's.
    expect(mapCredits("en")).toHaveLength(1);
  });

  it("add the publishers whose venues are on screen, each once, in registry order", () => {
    const places = [
      { credits: ["openstreetmap" as const] },
      { credits: ["teatrul-national-timisoara" as const, "filarmonica-banatul" as const] },
      { credits: ["filarmonica-banatul" as const] },
    ];
    expect(publishersOf(places)).toEqual(["filarmonica-banatul", "teatrul-national-timisoara"]);
    const credits = mapCredits("en", publishersOf(places));
    expect(credits).toHaveLength(3);
    expect(credits[1]).toBe(creditHtml("filarmonica-banatul", "en"));
    expect(credits[1]).toContain(">Filarmonica Banatul</a>");
  });

  it("escape the registry's text before Leaflet reads it as HTML", () => {
    expect(creditHtml("teatrul-national-timisoara", "ro")).not.toMatch(/<(?!a |\/a>)/);
  });
});
