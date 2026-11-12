import { SOURCES, type Delivery, type Reuse, type SourceEntry, type SourceRegistry } from "./sources.js";

const DELIVERY: Record<Delivery, string> = {
  synced: "Synced into the database when an admin asks",
  ingested: "Read when an admin refreshes it; a person accepts each event",
  geocoded: "Asked during an admin refresh, cached for good",
  live: "Fetched by the visitor's browser",
};

const REUSE: Record<Reuse, string> = {
  permitted: "Permitted",
  "permission-pending": "Permission pending",
  forbidden: "**Forbidden**",
};

const cell = (text: string) => text.replaceAll("|", "\\|");

function licence(s: SourceEntry): string {
  return s.licence.url ? `[${s.licence.name}](${s.licence.url})` : s.licence.name;
}

function carveOut(s: SourceEntry): string {
  const what =
    s.reuse === "forbidden"
      ? "Its terms forbid reuse. The API never publishes its rows: they are held back from every public place and event, " +
        "including rows published before the source was flipped. A fork must keep it `forbidden`, and must not publish " +
        "its content anywhere, until the publisher gives permission in writing."
      : `${s.termsCheckedOn ? "Its permission is not settled." : "Nobody has recorded a check of its terms."} ` +
        "The app uses it and credits it. A fork must read the terms itself before going public, then set `reuse` " +
        "to `permitted` or `forbidden` and record the date.";
  return [
    `### ${s.name} (\`${s.id}\`)`,
    "",
    `- **Reuse:** \`${s.reuse}\`. ${what}`,
    `- **Terms:** ${s.terms}`,
    `- **Checked:** ${s.termsCheckedOn ?? "never"}. Research: [${s.research}](${s.research}).`,
  ].join("\n");
}

/**
 * `DATA_SOURCES.md`, rendered from the registry. The file at the repo root is this function's
 * output (`npm run sources`), and a test fails when the two differ.
 */
export function renderDataSources(registry: SourceRegistry = SOURCES): string {
  const rows = registry.map(
    (s) =>
      `| ${s.name} (\`${s.id}\`) | ${s.kind} | ${s.host} | ${cell(s.usedFor)} | ${DELIVERY[s.delivery]} | ${licence(s)} | ${REUSE[s.reuse]} | [${cell(s.attribution.en)}](${s.attributionUrl}) | ${s.termsCheckedOn ?? "never"} |`,
  );
  const carved = registry.filter((s) => s.reuse !== "permitted");
  return [
    "# Data sources",
    "",
    "<!-- Generated from shared/src/sources.ts by `npm run sources`. Edit the registry, not this file. -->",
    "",
    "Every outside source the app reads data from. The registry in `shared/src/sources.ts` is the record;",
    "this file is generated from it, and a test fails when the two disagree.",
    "",
    "| Source | Kind | Host | Used for | How it arrives | Licence | Reuse | Credit | Terms checked |",
    "|---|---|---|---|---|---|---|---|---|",
    ...rows,
    "",
    "## Where the credit is shown",
    "",
    "- **On the map:** the attribution corner names the tiles in use, OpenStreetMap, and the publisher of every",
    "  event venue on screen. It links to the About page.",
    "- **On a place:** its panel names the source of the place (OpenStreetMap, or the publishers whose events",
    "  created it), and each event names its publisher.",
    "- **On the About page** (`/about-data`): the licences, in Romanian and English, with the approved event publishers.",
    "",
    "## Carve-outs",
    "",
    "Only a `forbidden` source is kept off the public map; a `permission-pending` one is published and credited.",
    "A source is never left out of this list to hide it. To flip one, change its `reuse` in the registry,",
    "run `npm run sources`, and deploy: its rows leave (or come back to) the public places and events at once,",
    "and nothing is deleted.",
    "",
    ...carved.flatMap((s) => [carveOut(s), ""]),
  ].join("\n");
}
