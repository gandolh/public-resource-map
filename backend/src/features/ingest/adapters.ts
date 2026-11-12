import {
  publisherForUrl,
  type SOURCES,
  type SourceEntry,
  type SourceMechanism,
  type SourceRegistry,
} from "@public-resource-map/shared";
import { parseIcal, type IcalRow } from "./ical.js";

/** A registry id (`shared/src/sources.ts`) of an event publisher. */
type PublisherId = Extract<(typeof SOURCES)[number], { kind: "event-publisher" }>["id"];

/** One listing as an adapter hands it over: unvalidated, perhaps with a known problem. */
export type AdapterRow = IcalRow;

export interface AdapterContext {
  source: { id: string; name: string; url: string | null; city: string | null };
  fetchText: (url: string) => Promise<string>;
}

/**
 * Reads one kind of source. The pipeline does everything after `read`, so an
 * adapter is only ever the source-specific part (decisions.md: per-adapter
 * extraction, shared everything else).
 */
export interface SourceAdapter {
  mechanism: SourceMechanism;
  /**
   * The registry publishers this adapter reads, at least one: a site's own adapter names its
   * site, a mechanism (iCal) every publisher whose feed it is trusted with. A source row is added
   * only for one of these, found by its feed's host, and the registry's `reuse` then decides what
   * the public sees (a `forbidden` publisher may run in development, never in production).
   */
  sources: readonly [PublisherId, ...PublisherId[]];
  read(ctx: AdapterContext): Promise<AdapterRow[]>;
}

/**
 * Any public iCal feed. A *mechanism*, not a site: which feeds to read is the
 * owner's per-source call (each `event_source` row), among the publishers named
 * here, and reading a published calendar is the clean end of decisions.md's
 * API-first order. A new publisher's feed is a registry entry and a name here.
 */
export const icalAdapter: SourceAdapter = {
  mechanism: "ical",
  sources: ["filarmonica-banatul", "teatrul-national-timisoara"],
  async read({ source, fetchText }) {
    if (!source.url) throw new Error(`${source.name} has no feed URL`);
    return parseIcal(await fetchText(source.url));
  },
};

export type AdapterRegistry = Record<string, SourceAdapter>;

export const builtInAdapters: AdapterRegistry = { ical: icalAdapter };

/** `ical:centrul-de-proiecte` → the `ical` adapter: one implementation, many sources. */
export function adapterFor(adapterKey: string, registry: AdapterRegistry): SourceAdapter | null {
  return registry[adapterKey.split(":")[0]] ?? null;
}

/**
 * The registry publisher a source row reads: the one its feed URL's host belongs to, if its
 * adapter names it. Undefined for a row no registry entry covers.
 */
export function publisherOfRow(
  row: { adapterKey: string; url: string | null },
  adapters: AdapterRegistry,
  registry: SourceRegistry,
): SourceEntry | undefined {
  const adapter = adapterFor(row.adapterKey, adapters);
  const publisher = publisherForUrl(row.url, registry);
  if (!adapter || !publisher) return undefined;
  return (adapter.sources as readonly string[]).includes(publisher.id) ? publisher : undefined;
}

/**
 * Reads a source's text, naming us with `userAgent` (`config.ingestUserAgent`) to every
 * source we read, as Nominatim's policy also requires.
 */
export const textFetcher =
  (userAgent: string) =>
  async (url: string): Promise<string> => {
    const res = await fetch(url, {
      headers: { "user-agent": userAgent, accept: "text/calendar, text/plain;q=0.9, */*;q=0.1" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`${url} answered ${res.status}`);
    return res.text();
  };
