import { createHash } from "node:crypto";

/**
 * Stable seed IDs (brief 08). Each seeded row's id is a name-based UUID
 * (RFC 9562 version 5) of a key that says what the row is: an OSM element for
 * a place (`osm:node/2634652196`), a slug for a hand-written venue or event.
 * The same key always gives the same id, so every `db:seed` lands the same
 * rows under the same ids, and the e2e suite can address them directly.
 */
const NAMESPACE = Buffer.from("8f0c2a5e6b1d4c3a9e7f20b4d6a1c853", "hex");

export function seedId(key: string): string {
  const hash = createHash("sha1").update(NAMESPACE).update(key).digest();
  hash[6] = (hash[6] & 0x0f) | 0x50; // version 5
  hash[8] = (hash[8] & 0x3f) | 0x80; // RFC variant
  const hex = hash.subarray(0, 16).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export const osmKey = (osmType: string, osmId: string) => `osm:${osmType}/${osmId}`;

/** The seeded rows the e2e suite reaches for by id. */
export const SEED = {
  places: {
    /** Muzeul de Artă, Piața Unirii — Timișoara's busiest seeded place. */
    tmArtMuseum: seedId(osmKey("node", "2634652196")),
    /** Muzeul Național de Artă al României — București, with a long-running exhibition. */
    buArtMuseum: seedId(osmKey("node", "2634652837")),
    /** Piața Victoriei — an event venue that is not in OSM's place set. */
    tmPiataVictoriei: seedId("venue:timisoara/piata-victoriei"),
  },
} as const;
