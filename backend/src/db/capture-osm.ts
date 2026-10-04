import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CITIES,
  buildOverpassQuery,
  elementsToPlaces,
  fetchOverpass,
  type OsmPlaceInput,
} from "../lib/osm-sync.js";

/**
 * Refresh the frozen OSM fixture that `db:seed` loads (brief 08). This is the
 * only part of seeding that touches the network: it runs the same Overpass
 * query and normalisation as the admin "Sync from OSM" button, once per city,
 * and writes the result to `fixtures/osm-places.json`, sorted so a refresh
 * diffs as changed rows rather than a reshuffle.
 *
 *   npm run db:capture-osm -w backend
 *
 * Overpass is a shared public service: run this by hand, rarely, never in CI.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(__dirname, "fixtures/osm-places.json");

export interface OsmFixture {
  capturedAt: string;
  source: string;
  places: OsmPlaceInput[];
}

/** Overpass answers 429/504 when busy; wait and ask again, a few times. */
async function withRetry<T>(run: () => Promise<T>, attempts = 4): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await run();
    } catch (err) {
      if (i >= attempts) throw err;
      console.warn(`  ${(err as Error).message}; retrying in ${30 * i}s`);
      await new Promise((r) => setTimeout(r, 30_000 * i));
    }
  }
}

async function capture() {
  const places: OsmPlaceInput[] = [];
  for (const city of Object.values(CITIES)) {
    const response = await withRetry(() => fetchOverpass(buildOverpassQuery(city)));
    const result = elementsToPlaces(response.elements ?? [], city.name);
    console.log(
      `${city.name}: ${response.elements.length} fetched, ${result.places.length} kept ` +
        `(${result.skippedUnnamed} unnamed, ${result.skippedNoGeometry} without a point)`,
    );
    places.push(...result.places);
  }
  places.sort(
    (a, b) =>
      a.city.localeCompare(b.city) ||
      a.osmType.localeCompare(b.osmType) ||
      Number(a.osmId) - Number(b.osmId),
  );
  const fixture: OsmFixture = {
    capturedAt: new Date().toISOString().slice(0, 10),
    source: "© OpenStreetMap contributors, ODbL — via the Overpass API",
    places,
  };
  // One place per line: small, and a refresh diffs row by row.
  const rows = fixture.places.map((p) => JSON.stringify(p)).join(",\n");
  fs.writeFileSync(
    out,
    `{"capturedAt":${JSON.stringify(fixture.capturedAt)},"source":${JSON.stringify(fixture.source)},"places":[\n${rows}\n]}\n`,
  );
  console.log(`Wrote ${places.length} places to ${path.relative(process.cwd(), out)}`);
}

capture().catch((err) => {
  console.error("Capture failed:", err);
  process.exit(1);
});
