import type { EventCategory } from "@public-resource-map/shared";
import { zonedTimeToInstant } from "../lib/time.js";

/**
 * A small iCalendar (RFC 5545) reader for event feeds (brief 04). Municipal
 * and cultural calendars often publish an unadvertised `.ics` feed, the second
 * rung of decisions.md's API-first order, and reading one is a contract, not
 * a scrape.
 *
 * Deliberately narrow: VEVENTs only; times in UTC, in Europe/Bucharest, floating
 * (taken as Bucharest) or all-day. Anything else, including any recurring event
 * (RRULE), is returned with a `problem`, which the pipeline quarantines as
 * needs-attention rather than guessing.
 */

export interface IcalRow {
  /** The fields a RawEvent wants; validated by the pipeline, not here. */
  raw: Record<string, unknown>;
  problem?: string;
}

interface Prop {
  params: Record<string, string>;
  value: string;
}

/** RFC 5545 §3.1: a line starting with a space or tab continues the previous one. */
function unfold(text: string): string[] {
  return text.replace(/\r?\n[ \t]/g, "").split(/\r?\n/);
}

function parseProp(line: string): [string, Prop] | null {
  const colon = line.search(/:(?=(?:[^"]*"[^"]*")*[^"]*$)/);
  if (colon < 0) return null;
  const [name, ...paramParts] = line.slice(0, colon).split(";");
  const params: Record<string, string> = {};
  for (const p of paramParts) {
    const eq = p.indexOf("=");
    if (eq > 0) params[p.slice(0, eq).toUpperCase()] = p.slice(eq + 1).replace(/^"|"$/g, "");
  }
  return [name.toUpperCase(), { params, value: line.slice(colon + 1) }];
}

function unescapeText(value: string): string {
  return value.replace(/\\n/gi, "\n").replace(/\\([,;\\])/g, "$1").trim();
}

/** A DTSTART/DTEND as an ISO instant, or a reason it cannot be one. */
export function icalTime(prop: Prop): { iso: string } | { problem: string } {
  const v = prop.value.trim();
  const date = /^(\d{4})(\d{2})(\d{2})$/.exec(v);
  if (date || prop.params.VALUE === "DATE") {
    const [, y, m, d] = date ?? /^(\d{4})(\d{2})(\d{2})/.exec(v) ?? [];
    if (!y) return { problem: `unreadable date ${v}` };
    return { iso: zonedTimeToInstant(+y, +m, +d).toISOString() };
  }
  const dt = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/.exec(v);
  if (!dt) return { problem: `unreadable date-time ${v}` };
  const [, y, m, d, hh, mm, ss, utc] = dt;
  if (utc) return { iso: new Date(Date.UTC(+y, +m - 1, +d, +hh, +mm, +ss)).toISOString() };
  const tz = prop.params.TZID;
  if (tz && tz !== "Europe/Bucharest") return { problem: `unsupported time zone ${tz}` };
  return { iso: zonedTimeToInstant(+y, +m, +d, +hh, +mm, +ss).toISOString() };
}

/**
 * Best-effort: a source's own category words to ours; unknown stays unset
 * ("other"). Each stem matches from the start of a word, so Romanian endings
 * still match ("meciul", "ateliere") but a stem inside another word does not
 * ("transport" is not sport, "concurs" is not a course); a few are whole words.
 */
const CATEGORY_WORDS: [RegExp, EventCategory][] = [
  [/\b(?:concert|muzic|music|recital|jazz|opera\b|operet)/, "concert"],
  [/\b(?:teatru|theat|spectacol|stand.?up|comedy)/, "theater"],
  [/\b(?:expozit|exhibit|vernisaj|galerie|gallery)/, "exhibition"],
  [/\bfestival/, "festival"],
  [/\b(?:atelier|workshop|curs|training)/, "workshop"],
  [/\b(?:sport|maraton|alergare|meci|match(?:es)?\b|fotbal)/, "sport"],
  [/\b(?:comunitat|community|dezbatere|consultare|lansare|conferint|conference)/, "community"],
];

export function guessCategory(text: string): EventCategory | undefined {
  const t = text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  return CATEGORY_WORDS.find(([re]) => re.test(t))?.[1];
}

/**
 * WordPress shortcodes (brief 31). The Events Calendar's export can carry a
 * page's raw shortcodes in DESCRIPTION. Teatrul Național's ticket button is
 * `[DKB url="https://www.eventim.ro/…" text="Cumpără bilet" …]`, and without
 * this every one of its events would show that as text.
 *
 * A bracketed tag counts as a shortcode when it has `name="value"` attributes,
 * is a closing `[/name]`, or opens a tag that is closed later in the text.
 * "[sold out]" is none of these and stays.
 */
const ATTR = String.raw`[\w-]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'\]]+)`;
const SHORTCODE_WITH_ATTRS = new RegExp(String.raw`\[[A-Za-z][\w-]*((?:\s+${ATTR})+)\s*\/?\]`, "g");
const SHORTCODE_CLOSE = /\[\/([A-Za-z][\w-]*)\]/g;
const SHORTCODE_BARE = /\[([A-Za-z][\w-]*)\s*\/?\]/g;
const URL_ATTR = /(?:^|\s)url\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'\]]+))/i;

/** A description without its shortcodes, and the `url` each removed one carried. */
export function stripShortcodes(text: string): { text: string | undefined; urls: string[] } {
  const urls: string[] = [];
  const closed = new Set([...text.matchAll(SHORTCODE_CLOSE)].map((m) => m[1].toLowerCase()));
  const stripped = text
    .replace(SHORTCODE_WITH_ATTRS, (_tag, attrs: string) => {
      const url = URL_ATTR.exec(attrs);
      const value = url?.[1] ?? url?.[2] ?? url?.[3];
      if (value) urls.push(value);
      return "";
    })
    .replace(SHORTCODE_CLOSE, "")
    .replace(SHORTCODE_BARE, (tag, name: string) => (closed.has(name.toLowerCase()) ? "" : tag));
  return { text: tidy(stripped), urls };
}

/**
 * Trim each line and collapse the blank runs a removed shortcode leaves.
 * `&nbsp;` is the one HTML entity these feeds send, on a line of its own, so it
 * counts as a space. An empty result is no description at all.
 */
function tidy(text: string): string | undefined {
  const out = text
    .replace(/&nbsp;/gi, " ")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return out || undefined;
}

/** Only an https link may become a ticket link (brief 31; brief 33 part 1). */
function isHttps(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

/** Every VEVENT in a feed, as rows for the pipeline. */
export function parseIcal(text: string): IcalRow[] {
  const rows: IcalRow[] = [];
  let props: Map<string, Prop> | null = null;
  let depth = 0; // nested components (VALARM) inside a VEVENT are skipped

  for (const line of unfold(text)) {
    if (/^BEGIN:VEVENT$/i.test(line)) {
      props = new Map();
      depth = 0;
      continue;
    }
    if (!props) continue;
    if (/^BEGIN:/i.test(line)) {
      depth++;
      continue;
    }
    if (/^END:VEVENT$/i.test(line) && depth === 0) {
      rows.push(toRow(props));
      props = null;
      continue;
    }
    if (/^END:/i.test(line)) {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (depth > 0) continue;
    const prop = parseProp(line);
    if (prop && !props.has(prop[0])) props.set(prop[0], prop[1]);
  }
  return rows;
}

function toRow(props: Map<string, Prop>): IcalRow {
  const text = (name: string) => {
    const p = props.get(name);
    return p ? unescapeText(p.value) || undefined : undefined;
  };
  const description = stripShortcodes(text("DESCRIPTION") ?? "");
  const raw: Record<string, unknown> = {
    externalId: text("UID"),
    title: text("SUMMARY"),
    venue: text("LOCATION"),
    description: description.text,
    sourceUrl: text("URL"),
    // A ticket button in the description is a buy link the source itself
    // provides (decisions.md), so it may become one here.
    buyUrl: description.urls.find(isHttps),
    cancelled: props.get("STATUS")?.value.trim().toUpperCase() === "CANCELLED" || undefined,
  };
  const category = guessCategory(`${text("CATEGORIES") ?? ""} ${text("SUMMARY") ?? ""}`);
  if (category) raw.category = category;

  const problems: string[] = [];
  const start = props.get("DTSTART");
  if (start) {
    const t = icalTime(start);
    if ("iso" in t) raw.startDate = t.iso;
    else problems.push(t.problem);
  }
  const end = props.get("DTEND");
  if (end) {
    const t = icalTime(end);
    if ("iso" in t) raw.endDate = t.iso;
    else problems.push(t.problem);
  }
  if (props.has("RRULE")) problems.push("a recurring event (RRULE), which is not expanded");
  for (const [k, v] of Object.entries(raw)) if (v === undefined) delete raw[k];
  return problems.length ? { raw, problem: problems.join("; ") } : { raw };
}
