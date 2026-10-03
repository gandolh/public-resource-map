import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { adapterFor, builtInAdapters, fetchText, icalAdapter } from "./adapters.js";

/** The real fetch path: a local server stands in for a publisher's feed. */

const ICS = [
  "BEGIN:VCALENDAR",
  "VERSION:2.0",
  "BEGIN:VEVENT",
  "UID:1@example.ro",
  "SUMMARY:Expoziție de toamnă",
  "DTSTART;TZID=Europe/Bucharest:20261015T180000",
  "LOCATION:Muzeul de Artă",
  "END:VEVENT",
  "END:VCALENDAR",
].join("\r\n");

let server: Server;
let base: string;
let lastUserAgent: string | undefined;

beforeAll(async () => {
  server = createServer((req, res) => {
    lastUserAgent = req.headers["user-agent"];
    if (req.url === "/feed.ics") {
      res.writeHead(200, { "content-type": "text/calendar" }).end(ICS);
    } else {
      res.writeHead(503).end();
    }
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => new Promise<void>((r) => server.close(() => r())));

describe("the iCal adapter over HTTP (brief 04)", () => {
  const source = (url: string | null) => ({ id: "s", name: "Muzeu", url, city: "Timișoara" });

  it("reads a feed and identifies itself", async () => {
    const rows = await icalAdapter.read({ source: source(`${base}/feed.ics`), fetchText });
    expect(rows).toEqual([
      {
        raw: expect.objectContaining({
          externalId: "1@example.ro",
          title: "Expoziție de toamnă",
          startDate: "2026-10-15T15:00:00.000Z",
          venue: "Muzeul de Artă",
          category: "exhibition",
        }),
      },
    ]);
    expect(lastUserAgent).toMatch(/^CivicMap-prm\//);
  });

  it("fails loudly on an HTTP error or a missing URL, so the source reads as an error", async () => {
    await expect(icalAdapter.read({ source: source(`${base}/gone`), fetchText })).rejects.toThrow(/503/);
    await expect(icalAdapter.read({ source: source(null), fetchText })).rejects.toThrow(/no feed URL/);
  });

  it("is chosen by the part of the key before the colon", () => {
    expect(adapterFor("ical:centrul-de-proiecte", builtInAdapters)).toBe(icalAdapter);
    expect(adapterFor("iabilet", builtInAdapters)).toBeNull();
  });
});
