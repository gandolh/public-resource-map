import type { EventLens } from "@public-resource-map/shared";

/**
 * All user-facing date reasoning happens in Romanian local time. The DB stores
 * UTC ISO 8601 strings (locked convention); "today" and "this weekend" only
 * mean anything in Europe/Bucharest, so the conversion lives here and nowhere
 * else. No dependency: `Intl` already knows the zone and its DST rules.
 */
export const APP_TZ = "Europe/Bucharest";

const PARTS = new Intl.DateTimeFormat("en-US", {
  timeZone: APP_TZ,
  hour12: false,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  weekday: "short",
});

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

export interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  /** 0 = Sunday … 6 = Saturday, in Bucharest. */
  weekday: number;
}

/** The wall-clock reading in Bucharest at a given instant. */
export function zonedParts(instant: Date): ZonedParts {
  const map: Record<string, string> = {};
  for (const part of PARTS.formatToParts(instant)) map[part.type] = part.value;
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    // `hour12:false` can render midnight as "24" in some ICU versions.
    hour: Number(map.hour) % 24,
    minute: Number(map.minute),
    second: Number(map.second),
    weekday: WEEKDAY_INDEX[map.weekday ?? "Sun"] ?? 0,
  };
}

/** Bucharest's UTC offset, in ms, at a given instant (DST-aware). */
function offsetMs(instant: Date): number {
  const p = zonedParts(instant);
  const asIfUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  // Intl drops sub-second precision, so compare against a floored instant.
  return asIfUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

/**
 * The instant at which the Bucharest wall clock reads the given date and time.
 * Two passes: the first offset guess is taken at the naive instant, the second
 * at the corrected one, which is what makes DST-transition days come out right.
 */
export function zonedTimeToInstant(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
): Date {
  const naive = Date.UTC(year, month - 1, day, hour, minute, second);
  const firstGuess = new Date(naive - offsetMs(new Date(naive)));
  return new Date(naive - offsetMs(firstGuess));
}

export interface LensWindow {
  /** Inclusive lower bound, UTC ISO. */
  from: string;
  /** Inclusive upper bound, UTC ISO. */
  to: string;
}

/**
 * How far ahead "all upcoming" reaches. The locked decision caps the horizon so
 * a place panel cannot fill with events two years out.
 */
export const HORIZON_DAYS = 90;

/**
 * Turn a lens into the UTC window the query should use.
 *
 * - `today`    — now → end of today in Bucharest.
 * - `weekend`  — the coming Sat 00:00 → Sun 23:59:59; during a weekend, the
 *                window starts now rather than in the past.
 * - `all`      — now → now + 90 days.
 *
 * Every window starts at `now` at the earliest: only upcoming events surface.
 */
export function lensWindow(lens: EventLens, now: Date = new Date()): LensWindow {
  const p = zonedParts(now);
  const nowIso = now.toISOString();

  if (lens === "today") {
    const endOfToday = zonedTimeToInstant(p.year, p.month, p.day, 23, 59, 59);
    return { from: nowIso, to: endOfToday.toISOString() };
  }

  if (lens === "weekend") {
    // Days until Saturday; 0 when today is already Saturday.
    const untilSaturday = (6 - p.weekday + 7) % 7;
    // On Sunday the weekend is the one in progress, not the one in six days.
    const startOffset = p.weekday === 0 ? -1 : untilSaturday;
    const saturday = zonedTimeToInstant(p.year, p.month, p.day + startOffset, 0, 0, 0);
    const sunday = zonedTimeToInstant(p.year, p.month, p.day + startOffset + 1, 23, 59, 59);
    const from = saturday.getTime() > now.getTime() ? saturday.toISOString() : nowIso;
    return { from, to: sunday.toISOString() };
  }

  const horizon = new Date(now.getTime() + HORIZON_DAYS * 86_400_000);
  return { from: nowIso, to: horizon.toISOString() };
}
