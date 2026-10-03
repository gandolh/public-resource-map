import type { SourceMechanism } from "@public-resource-map/shared";
import { parseIcal, type IcalRow } from "./ical.js";

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
   * False for an adapter whose source has not cleared the legal posture (the
   * iaBilet rule): it may run in development, never in production.
   */
  productionAllowed: boolean;
  read(ctx: AdapterContext): Promise<AdapterRow[]>;
}

/**
 * Any public iCal feed. A *mechanism*, not a site: which feeds to read is the
 * owner's per-source call (each `event_source` row), and reading a published
 * calendar is the clean end of decisions.md's API-first order.
 */
export const icalAdapter: SourceAdapter = {
  mechanism: "ical",
  productionAllowed: true,
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

/** Identifies us to every source we read, as Nominatim's policy also requires. */
export function userAgent(): string {
  return process.env.INGEST_USER_AGENT?.trim() || "CivicMap-prm/0.1 (admin-triggered event ingestion)";
}

export async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "user-agent": userAgent(), accept: "text/calendar, text/plain;q=0.9, */*;q=0.1" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`${url} answered ${res.status}`);
  return res.text();
}
