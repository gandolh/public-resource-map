/**
 * Venue ↔ place matching (brief 04; decisions.md → Ingestion & data mechanics).
 *
 * A source names a venue the way its poster does ("Sala Mare, Casa de Cultură");
 * OSM names the place the way a map does ("Casa de Cultură a Municipiului
 * Timișoara"). Both are normalized, room noise is dropped, the city's own name
 * is ignored, and the token sets are compared. Two thresholds, set
 * conservatively: an ambiguous match costs the admin one click, a wrong
 * auto-match puts an event at the wrong building.
 */

/** Lowercase, no diacritics, punctuation to spaces, whitespace collapsed. */
export function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** A comma segment naming a room inside the venue, not the venue. */
const ROOM = /^(sala|sali|scena|foaier|foyer|studio|studioul|etaj|etajul|aula|camera|hol|holul|curte|curtea|terasa)\b/;

/** The venue without its room: "Sala Mare, Casa de Cultură" → "casa de cultura". */
export function normalizeVenue(venue: string): string {
  const segments = venue
    .split(/[,;|]|\s[-–—]\s/)
    .map((s) => normalizeText(s))
    .filter(Boolean);
  const kept = segments.filter((s) => !ROOM.test(s));
  return (kept.length ? kept : segments).join(" ");
}

/** Joining words that say nothing about which place this is. */
const STOP = new Set(["de", "a", "al", "ale", "si", "din", "la", "lui", "cu", "in", "pe", "the", "of", "and"]);

function tokens(text: string, ignore: Set<string>): Set<string> {
  return new Set(text.split(" ").filter((t) => t && !STOP.has(t) && !ignore.has(t)));
}

/**
 * How alike two venue names are, 0–1: the mean of containment (the shorter
 * name's tokens found in the longer) and Dice (overlap against both sizes).
 * Containment alone would let "Casa" match every "Casa …"; Dice alone would
 * punish an OSM name that simply says more.
 */
export function venueScore(a: string, b: string, cityName = ""): number {
  const ignore = tokens(normalizeText(cityName), new Set());
  const ta = tokens(normalizeVenue(a), ignore);
  const tb = tokens(normalizeVenue(b), ignore);
  if (ta.size === 0 || tb.size === 0) return 0;
  let common = 0;
  for (const t of ta) if (tb.has(t)) common++;
  const containment = common / Math.min(ta.size, tb.size);
  const dice = (2 * common) / (ta.size + tb.size);
  return (containment + dice) / 2;
}

export const AUTO_MATCH = 0.85;
export const AMBIGUOUS_MATCH = 0.5;
/** An auto-match must also beat the runner-up by this much. */
const AUTO_MARGIN = 0.1;
const MAX_CANDIDATES = 3;

export interface MatchCandidate {
  placeId: string;
  name: string;
  score: number;
}

export type VenueMatch =
  | { status: "auto-matched"; placeId: string; candidates: MatchCandidate[] }
  | { status: "ambiguous"; candidates: MatchCandidate[] }
  | { status: "unmatched"; candidates: [] };

/** Match a venue against the places of its city. */
export function matchVenue(
  venue: string,
  places: { id: string; name: string }[],
  cityName: string,
): VenueMatch {
  const scored = places
    .map((p) => ({ placeId: p.id, name: p.name, score: venueScore(venue, p.name, cityName) }))
    .filter((c) => c.score >= AMBIGUOUS_MATCH)
    .sort((x, y) => y.score - x.score)
    .slice(0, MAX_CANDIDATES)
    .map((c) => ({ ...c, score: Math.round(c.score * 1000) / 1000 }));

  if (scored.length === 0) return { status: "unmatched", candidates: [] };
  const [best, second] = scored;
  if (best.score >= AUTO_MATCH && (!second || best.score - second.score >= AUTO_MARGIN)) {
    return { status: "auto-matched", placeId: best.placeId, candidates: scored };
  }
  return { status: "ambiguous", candidates: scored };
}

/**
 * The geocode cache key: conservative on purpose (decisions.md). Romanian
 * street abbreviations are expanded so "Str. Miron Costin nr. 2" and "Strada
 * Miron Costin 2" share one entry, and the city is appended so the same street
 * in two cities never does.
 */
export function normalizeAddress(address: string, city: string): string {
  const expanded = ` ${address.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")} `
    .replace(/\bstr\.?(?=\s)/g, "strada")
    .replace(/\b(bd|bdul|blvd)\.?(?=\s)/g, "bulevardul")
    .replace(/\bcal\.?(?=\s)/g, "calea")
    .replace(/\bal\.?(?=\s)/g, "aleea")
    .replace(/\bsos\.?(?=\s)/g, "soseaua")
    .replace(/\b(p-ta|p-ța|pta|pt)\.?(?=\s)/g, "piata")
    .replace(/\bnr\.?(?=\s)/g, " ");
  return `${normalizeText(expanded)} ${normalizeText(city)}`.replace(/\s+/g, " ").trim();
}
