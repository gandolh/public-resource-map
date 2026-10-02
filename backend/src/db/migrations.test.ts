import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const meta = fileURLToPath(new URL("../../drizzle/meta/", import.meta.url));

interface Journal {
  entries: { idx: number; tag: string }[];
}
interface Snapshot {
  id: string;
  prevId: string;
}

const pad = (idx: number) => String(idx).padStart(4, "0");

// Brief 23: 0001_ward_cutover was hand-written without a snapshot, so
// drizzle-kit diffed schema.ts against the pre-cutover 0000 snapshot and offered
// to re-drop tables that no longer exist. A hand-written migration must ship
// its snapshot too, chained to the one before it.
describe("drizzle migration metadata", () => {
  const journal = JSON.parse(readFileSync(`${meta}_journal.json`, "utf8")) as Journal;

  it("every journal entry has a snapshot", () => {
    const missing = journal.entries
      .map((e) => `${pad(e.idx)}_snapshot.json`)
      .filter((file) => !existsSync(`${meta}${file}`));
    expect(missing).toEqual([]);
  });

  it("each snapshot's prevId is the previous snapshot's id", () => {
    let prev = "00000000-0000-0000-0000-000000000000";
    for (const { idx } of journal.entries) {
      const snap = JSON.parse(readFileSync(`${meta}${pad(idx)}_snapshot.json`, "utf8")) as Snapshot;
      expect(snap.prevId, `${pad(idx)}_snapshot.json`).toBe(prev);
      prev = snap.id;
    }
  });
});
