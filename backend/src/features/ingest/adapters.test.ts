import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { loadConfig } from "../../config.js";
import { SOURCES } from "@public-resource-map/shared";
import {
  adapterFor,
  builtInAdapters,
  icalAdapter,
  publisherOfRow,
  textFetcher,
  type SourceAdapter,
} from "./adapters.js";

// The User-Agent the settings give by default.
const fetchText = textFetcher(loadConfig({ PUBLIC_ORIGIN: "http://localhost:5173" }).ingestUserAgent);

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

describe("the iCal adapter over HTTP", () => {
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

describe("an adapter names the publishers it reads", () => {
  const read = async () => [];

  it("or it does not type-check", () => {
    // @ts-expect-error -- no `sources`: an adapter cannot be registered without a source id
    const unnamed: SourceAdapter = { mechanism: "ical", read };
    // @ts-expect-error -- an empty list names nothing
    const empty: SourceAdapter = { mechanism: "ical", sources: [], read };
    // @ts-expect-error -- OpenStreetMap is in the registry, but it is no event publisher
    const notAPublisher: SourceAdapter = { mechanism: "ical", sources: ["openstreetmap"], read };
    // @ts-expect-error -- a name the registry does not have
    const unknown: SourceAdapter = { mechanism: "ical", sources: ["zile-si-nopti"], read };
    expect([unnamed, empty, notAPublisher, unknown]).toHaveLength(4);
  });

  it("and a source row is the named publisher its feed's host belongs to", () => {
    const row = (url: string | null) => ({ adapterKey: "ical:any-slug", url });
    expect(publisherOfRow(row("https://www.tntm.ro/?ical=1"), builtInAdapters, SOURCES)?.id).toBe(
      "teatrul-national-timisoara",
    );
    expect(publisherOfRow(row("https://filarmonicabanatul.ro/evenimente/?ical=1"), builtInAdapters, SOURCES)?.id).toBe(
      "filarmonica-banatul",
    );
    // In the registry, but the iCal adapter does not read it; and a host no entry has.
    expect(publisherOfRow(row("https://www.iabilet.ro/x.ics"), builtInAdapters, SOURCES)).toBeUndefined();
    expect(publisherOfRow(row("https://example.org/x.ics"), builtInAdapters, SOURCES)).toBeUndefined();
    expect(
      publisherOfRow({ adapterKey: "nope:x", url: "https://www.tntm.ro/" }, builtInAdapters, SOURCES),
    ).toBeUndefined();
  });
});
