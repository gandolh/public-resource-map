import { describe, expect, it } from "vitest";
import { matchVenue, normalizeAddress, normalizeVenue, venueScore } from "./match.js";

const TM = "Timișoara";
const places = [
  { id: "casa", name: "Casa de Cultură a Municipiului Timișoara" },
  { id: "muzeu", name: "Muzeul de Artă Timișoara" },
  { id: "muzeu-banat", name: "Muzeul Național al Banatului" },
  { id: "teatru", name: "Teatrul Național „Mihai Eminescu” Timișoara" },
  { id: "parc", name: "Parcul Rozelor" },
];

describe("normalizeVenue (brief 04)", () => {
  it("drops the room and keeps the venue", () => {
    expect(normalizeVenue("Sala Mare, Casa de Cultură")).toBe("casa de cultura");
    expect(normalizeVenue("Casa de Cultură – Foaier")).toBe("casa de cultura");
  });
  it("keeps a venue that is only a room name rather than returning nothing", () => {
    expect(normalizeVenue("Sala Mare")).toBe("sala mare");
  });
});

describe("matchVenue", () => {
  it("auto-matches a poster's short name to the OSM long name", () => {
    const m = matchVenue("Sala Mare, Casa de Cultură", places, TM);
    expect(m.status).toBe("auto-matched");
    expect(m.status === "auto-matched" && m.placeId).toBe("casa");
  });

  it("is ambiguous, not wrong, when two museums both fit", () => {
    const m = matchVenue("Muzeul Timișoara", places, TM);
    expect(m.status).toBe("ambiguous");
    expect(m.candidates.map((c) => c.placeId)).toEqual(expect.arrayContaining(["muzeu"]));
  });

  it("matches the theatre despite quotes and diacritics", () => {
    const m = matchVenue("Teatrul National Mihai Eminescu", places, TM);
    expect(m.status === "auto-matched" && m.placeId).toBe("teatru");
  });

  it("leaves an unknown venue unmatched, for geocoding", () => {
    expect(matchVenue("Club Daos", places, TM).status).toBe("unmatched");
  });

  it("ignores the city's own name, which every place shares", () => {
    expect(venueScore("Timișoara", "Muzeul de Artă Timișoara", TM)).toBe(0);
  });
});

describe("normalizeAddress", () => {
  it("expands street abbreviations so spellings share a cache key", () => {
    expect(normalizeAddress("Str. Miron Costin nr. 2", TM)).toBe(
      normalizeAddress("Strada Miron Costin 2", TM),
    );
    expect(normalizeAddress("Bd. Revoluției 5", TM)).toBe("bulevardul revolutiei 5 timisoara");
  });
  it("keeps the same street in two cities apart", () => {
    expect(normalizeAddress("Str. Florilor 1", TM)).not.toBe(normalizeAddress("Str. Florilor 1", "București"));
  });
});
