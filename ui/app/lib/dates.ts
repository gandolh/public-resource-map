import { APP_TZ } from "./i18n";

export type DayGroup = "today" | "tomorrow" | "weekend" | "later";

const dayKeyFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Bucharest calendar day, as a sortable key. */
export function dayKey(date: Date): string {
  return dayKeyFmt.format(date);
}

/**
 * The key of the Bucharest calendar day `days` after `date`'s. Calendar
 * arithmetic, not `days * 24 h`: the days the clocks change are 23 and 25
 * hours long, and adding 24 h near either switch lands on the wrong date.
 */
function dayKeyAfter(date: Date, days: number): string {
  const [y, m, d] = dayKey(date).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Day of the week (0 = Sunday) of `date`'s Bucharest calendar day. */
function weekday(date: Date): number {
  const [y, m, d] = dayKey(date).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/**
 * True while `now` is inside `[start, end]`: an exhibition that opened three
 * weeks ago and closes next month. A null end is a point event and is never
 * "running" (the API drops it once it starts; brief 19).
 */
export function isRunning(
  startIso: string,
  endIso: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!endIso) return false;
  const t = now.getTime();
  return new Date(startIso).getTime() <= t && t <= new Date(endIso).getTime();
}

/**
 * Which bucket an event falls into, judged on the Bucharest calendar rather
 * than the visitor's. A running event is "today", whenever it started.
 * "Weekend" means the coming Saturday and Sunday, and only claims an event that
 * today/tomorrow have not already claimed — so on a Friday "tomorrow" wins over
 * "this weekend" for Saturday's events.
 */
export function groupFor(
  startIso: string,
  endIso: string | null | undefined,
  now: Date = new Date(),
): DayGroup {
  if (isRunning(startIso, endIso, now)) return "today";
  const start = new Date(startIso);
  const key = dayKey(start);

  if (key === dayKey(now)) return "today";
  if (key === dayKeyAfter(now, 1)) return "tomorrow";

  const today = weekday(now);
  // Days from today until the coming Saturday (0 when today is Saturday).
  const untilSaturday = (6 - today + 7) % 7;
  const saturdayKey = dayKeyAfter(now, today === 0 ? -1 : untilSaturday);
  const sundayKey = dayKeyAfter(now, today === 0 ? 0 : untilSaturday + 1);

  if (key === saturdayKey || key === sundayKey) return "weekend";
  return "later";
}

const ORDER: DayGroup[] = ["today", "tomorrow", "weekend", "later"];

export interface GroupedEvents<T> {
  group: DayGroup;
  items: T[];
}

/**
 * Bucket a date-ordered list into Today / Tomorrow / This weekend / Later,
 * dropping empty buckets. The API already sorts by start, so order is kept, and
 * running events (earliest starts) lead "Today".
 */
export function groupByDay<T>(
  items: T[],
  spanOf: (item: T) => { start: string; end: string | null | undefined },
  now: Date = new Date(),
): GroupedEvents<T>[] {
  const buckets = new Map<DayGroup, T[]>();
  for (const item of items) {
    const { start, end } = spanOf(item);
    const group = groupFor(start, end, now);
    const list = buckets.get(group);
    if (list) list.push(item);
    else buckets.set(group, [item]);
  }
  return ORDER.filter((g) => buckets.has(g)).map((group) => ({
    group,
    items: buckets.get(group)!,
  }));
}
