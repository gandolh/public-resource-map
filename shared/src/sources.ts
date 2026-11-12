import { z } from "zod";

/**
 * The source registry: every outside source the app reads data from, with its licence, whether its
 * content may be republished, and the credit it needs. One machine-readable place, read by the API
 * (which holds back a `forbidden` source's rows and credits the rest), the About page, the map's
 * attribution, and `DATA_SOURCES.md` (generated: `npm run sources`).
 *
 * A source's reuse status changes by editing this file and deploying. Rows are never deleted to
 * hide a source: the API leaves them out at read time, so flipping a source back restores them.
 */

/** What a source is to the app. */
export const sourceKinds = ["osm", "event-publisher", "geocoder", "tiles"] as const;
export type SourceKind = (typeof sourceKinds)[number];

/**
 * Whether the source's content may be republished. `forbidden` is the only one held back
 * (owner, 2026-11-10): a `permission-pending` source is published and credited like a permitted one.
 */
export const reuseLevels = ["permitted", "permission-pending", "forbidden"] as const;
export type Reuse = (typeof reuseLevels)[number];

/** How the source's data reaches the app. */
export const deliveries = ["synced", "ingested", "geocoded", "live"] as const;
export type Delivery = (typeof deliveries)[number];

export interface Localized {
  ro: string;
  en: string;
}

export interface SourceEntry {
  /** Stable, kebab-case; what the API's credits carry. */
  id: string;
  kind: SourceKind;
  name: string;
  /** The host the app reads, without `www.`: a feed on `www.host` or any subdomain counts as it. */
  host: string;
  /** What the app uses it for, in a few words. */
  usedFor: string;
  delivery: Delivery;
  licence: { name: string; url: string | null };
  reuse: Reuse;
  /** What the terms say, and who decided the reuse status. */
  terms: string;
  /** The credit text shown in the app, and where it links. */
  attribution: Localized;
  attributionUrl: string;
  /** When the source's terms were last read, or null if nobody has recorded a check. */
  termsCheckedOn: string | null;
  /** A repo-relative path to the research behind the entry. */
  research: string;
}

const LEGAL_POSTURE = "corpus/wiki/decisions.md";
const SHORTLIST = "corpus/wiki/history/2026-10-04-source-shortlist.md";
const BASEMAP = "corpus/wiki/decisions-ui.md";

const ODBL = { name: "ODbL 1.0", url: "https://opendatacommons.org/licenses/odbl/" };
const OSM_CREDIT = { ro: "© OpenStreetMap contributors", en: "© OpenStreetMap contributors" };
const OSM_COPYRIGHT = "https://www.openstreetmap.org/copyright";

export const SOURCES = [
  {
    id: "openstreetmap",
    kind: "osm",
    name: "OpenStreetMap",
    host: "overpass-api.de",
    usedFor: "Every public place on the map, through the Overpass API",
    delivery: "synced",
    licence: ODBL,
    reuse: "permitted",
    terms: "Open data: reuse permitted with attribution to OpenStreetMap contributors.",
    attribution: OSM_CREDIT,
    attributionUrl: OSM_COPYRIGHT,
    termsCheckedOn: "2026-06-28",
    research: LEGAL_POSTURE,
  },
  {
    id: "nominatim",
    kind: "geocoder",
    name: "Nominatim",
    host: "nominatim.openstreetmap.org",
    usedFor: "Coordinates for an event venue no OpenStreetMap place matched",
    delivery: "geocoded",
    licence: ODBL,
    reuse: "permitted",
    terms:
      "OpenStreetMap data under the Nominatim usage policy: at most one request a second, an identifying User-Agent, no bulk geocoding.",
    attribution: OSM_CREDIT,
    attributionUrl: OSM_COPYRIGHT,
    termsCheckedOn: "2026-06-28",
    research: LEGAL_POSTURE,
  },
  {
    id: "osm-tiles",
    kind: "tiles",
    name: "OpenStreetMap tiles",
    host: "tile.openstreetmap.org",
    usedFor: "The basemap when no CARTO key is set",
    delivery: "live",
    licence: ODBL,
    reuse: "permission-pending",
    terms: "The OSM Foundation's tile usage policy; no reading of it is recorded.",
    attribution: OSM_CREDIT,
    attributionUrl: OSM_COPYRIGHT,
    termsCheckedOn: null,
    research: BASEMAP,
  },
  {
    id: "carto",
    kind: "tiles",
    name: "CARTO basemaps",
    host: "basemaps.cartocdn.com",
    usedFor: "The basemap (Positron and Dark Matter) when a CARTO key is set",
    delivery: "live",
    licence: { name: "CARTO basemap terms", url: "https://carto.com/attributions" },
    reuse: "permission-pending",
    terms: "Served only with an API key since 2026-09-04; no reading of CARTO's terms is recorded.",
    attribution: { ro: "© CARTO", en: "© CARTO" },
    attributionUrl: "https://carto.com/attributions",
    termsCheckedOn: null,
    research: BASEMAP,
  },
  {
    id: "filarmonica-banatul",
    kind: "event-publisher",
    name: "Filarmonica Banatul",
    host: "filarmonicabanatul.ro",
    usedFor: "Concerts in Timișoara, from its public iCal feed",
    delivery: "ingested",
    licence: { name: "None stated", url: null },
    reuse: "permitted",
    terms:
      "A public institution with no terms-of-use page and nothing forbidding reuse; robots.txt allows the feed. The owner accepted republishing listings and descriptions with the source link shown (2026-10-06).",
    attribution: { ro: "Filarmonica Banatul", en: "Filarmonica Banatul" },
    attributionUrl: "https://filarmonicabanatul.ro/evenimente/",
    termsCheckedOn: "2026-10-06",
    research: SHORTLIST,
  },
  {
    id: "teatrul-national-timisoara",
    kind: "event-publisher",
    name: "Teatrul Național Timișoara",
    host: "tntm.ro",
    usedFor: "Performances in Timișoara, from its public iCal feed",
    delivery: "ingested",
    licence: { name: "All rights reserved (site footer)", url: null },
    reuse: "permitted",
    terms:
      "A public institution with no terms-of-use page and nothing forbidding reuse; the footer says “Toate drepturile rezervate”, and robots.txt allows the feed. The owner accepted republishing listings and descriptions with the source link shown (2026-10-06).",
    attribution: { ro: "Teatrul Național Timișoara", en: "Teatrul Național Timișoara" },
    attributionUrl: "https://www.tntm.ro/",
    termsCheckedOn: "2026-10-06",
    research: SHORTLIST,
  },
  {
    id: "iabilet",
    kind: "event-publisher",
    name: "iaBilet",
    host: "iabilet.ro",
    usedFor: "Nothing in production; a proof-of-concept integration only",
    delivery: "ingested",
    licence: { name: "iaBilet terms of use", url: "https://www.iabilet.ro/terms/ro/" },
    reuse: "forbidden",
    terms:
      "Art. 28.3 forbids taking, reproducing or publicly communicating any of the site's content, in whole or in part. Permission is a hard blocker before any public use.",
    attribution: { ro: "iaBilet", en: "iaBilet" },
    attributionUrl: "https://www.iabilet.ro/",
    termsCheckedOn: "2026-06-28",
    research: LEGAL_POSTURE,
  },
] as const satisfies readonly SourceEntry[];

export type SourceId = (typeof SOURCES)[number]["id"];
/** The registry ids, for the API's credit fields. */
export const sourceIds = SOURCES.map((s) => s.id) as [SourceId, ...SourceId[]];
export const sourceIdSchema = z.enum(sourceIds);

/** The registry as code reads it: a test may pass a copy with one source flipped. */
export type SourceRegistry = readonly (SourceEntry & { id: SourceId })[];

/** The entry for `id`, or undefined when this registry has no such source. */
export function sourceById(
  id: string,
  registry: SourceRegistry = SOURCES,
): (SourceEntry & { id: SourceId }) | undefined {
  return registry.find((s) => s.id === id);
}

/** True when `hostname` is `host`, `www.host` or another subdomain of it. */
export function hostMatches(hostname: string, host: string): boolean {
  const h = hostname.toLowerCase();
  return h === host || h.endsWith(`.${host}`);
}

/**
 * The event publisher a feed URL belongs to, by its host. This is how a stored source row (its
 * feed URL) is tied to the registry, whatever slug its adapter key was given.
 */
export function publisherForUrl(
  url: string | null,
  registry: SourceRegistry = SOURCES,
): (SourceEntry & { id: SourceId }) | undefined {
  if (!url) return undefined;
  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    return undefined;
  }
  return registry.find((s) => s.kind === "event-publisher" && hostMatches(hostname, s.host));
}
