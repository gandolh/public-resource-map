import { describe, expect, it } from "vitest";
import { mapPath, mapSearch, mapSearchKeeping, mapShareUrl, parseMapSearch } from "./mapUrl";

describe("parseMapSearch", () => {
  it("reads the city, search, filters, lens, camera and place", () => {
    expect(
      parseMapSearch(
        "?city=bucuresti&q=muzeu%20de%20art%C4%83&f=library,park&when=today&map=15/44.43530/26.10250&place=abc",
      ),
    ).toEqual({
      city: "bucuresti",
      q: "muzeu de artă",
      f: ["library", "park"],
      when: "today",
      map: { zoom: 15, lat: 44.4353, lng: 26.1025 },
      place: "abc",
    });
  });

  it("drops what it does not know, and never throws", () => {
    expect(parseMapSearch("?city=cluj&f=library,casino,library&when=all&map=15/abc/1&q=%20%20")).toEqual({
      f: ["library"],
    });
    expect(parseMapSearch("?map=99/0/0")).toEqual({});
    expect(parseMapSearch("")).toEqual({});
  });
});

describe("mapSearch", () => {
  it("writes the fields in a fixed order, with commas and slashes readable", () => {
    expect(
      mapSearch({
        city: "timisoara",
        q: "parc",
        f: ["library", "park"],
        when: "weekend",
        map: { zoom: 14.2, lat: 45.75391234, lng: 21.2257 },
      }),
    ).toBe("?city=timisoara&q=parc&f=library,park&when=weekend&map=14/45.75391/21.22570");
  });

  it("is empty for an empty view, and leaves the camera out until the user moved the map", () => {
    expect(mapSearch({})).toBe("");
    expect(mapSearch({ city: "timisoara", q: " ", f: [] })).toBe("?city=timisoara");
  });

  it("round-trips through parseMapSearch", () => {
    const view = { city: "bucuresti", q: "a&b=c?", f: ["museum" as const], when: "today" as const };
    expect(parseMapSearch(mapSearch(view))).toEqual(view);
  });
});

describe("mapSearchKeeping", () => {
  it("keeps another feature's parameters (a favourite pending sign-in), after the map's own", () => {
    expect(mapSearchKeeping({ city: "timisoara", q: "x" }, "?favorite=place%3A1&q=old&map=1/2/3")).toBe(
      "?city=timisoara&q=x&favorite=place%3A1",
    );
    expect(mapSearchKeeping({}, "?favorite=place%3A1")).toBe("?favorite=place%3A1");
    expect(mapSearchKeeping({ city: "timisoara" }, "")).toBe("?city=timisoara");
  });
});

describe("the share URL", () => {
  const view = { city: "timisoara", q: "parc", f: ["park" as const], place: "abc" };

  it("puts the selected place in the path", () => {
    expect(mapPath(view)).toBe("/places/abc?city=timisoara&q=parc&f=park");
    expect(mapPath({ city: "timisoara" })).toBe("/?city=timisoara");
  });

  it("keeps the deployed base path", () => {
    expect(mapShareUrl(view, "https://example.org", "/prm/")).toBe(
      "https://example.org/prm/places/abc?city=timisoara&q=parc&f=park",
    );
    expect(mapShareUrl({ city: "bucuresti" }, "https://example.org", "/prm/")).toBe(
      "https://example.org/prm/?city=bucuresti",
    );
  });

  it("works at the root in dev", () => {
    expect(mapShareUrl({ place: "42" }, "http://localhost:5173", "/")).toBe("http://localhost:5173/places/42");
  });
});
