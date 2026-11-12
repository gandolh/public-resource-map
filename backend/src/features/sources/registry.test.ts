import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SOURCES, renderDataSources } from "@public-resource-map/shared";

const repoFile = (path: string) => new URL(`../../../../${path}`, import.meta.url);

describe("DATA_SOURCES.md", () => {
  it("is what the registry generates (run `npm run sources` after editing shared/src/sources.ts)", () => {
    expect(readFileSync(repoFile("DATA_SOURCES.md"), "utf8")).toBe(renderDataSources());
  });

  it("points every source at research that exists in the repo", () => {
    for (const s of SOURCES) expect(() => readFileSync(repoFile(s.research)), s.id).not.toThrow();
  });
});
