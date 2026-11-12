/**
 * Writes DATA_SOURCES.md from the source registry (`shared/src/sources.ts`). `npm run sources` builds
 * `shared` first, since this reads the built package.
 */
import { writeFileSync } from "node:fs";
import { renderDataSources } from "@public-resource-map/shared";

const target = new URL("../DATA_SOURCES.md", import.meta.url);
writeFileSync(target, renderDataSources());
console.log(`wrote ${target.pathname.split("/").pop() ?? "DATA_SOURCES.md"}`);
