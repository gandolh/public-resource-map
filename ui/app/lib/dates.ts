import { APP_TZ } from "./i18n";

export type DayGroup = "today" | "tomorrow" | "weekend" | "later";

const dayKeyFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const weekdayFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: APP_TZ,
  weekday: "short",
});

/** Bucharest calendar day, as a sortable key. */
export function dayKey(date: Date): string {
  return dayKeyFmt.format(date);
}

function weekday(date: Date): number {
  const names: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return names[weekdayFmt.format(date)] ?? 0;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
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
  if (key === dayKey(addDays(now, 1))) return "tomorrow";

  const today = weekday(now);
  // Days from today until the coming Saturday (0 when today is Saturday).
  const untilSaturday = (6 - today + 7) % 7;
  const saturdayKey = dayKey(addDays(now, today === 0 ? -1 : untilSaturday));
  const sundayKey = dayKey(addDays(now, today === 0 ? 0 : untilSaturday + 1));

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
