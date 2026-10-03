import { and, eq, gte, lte, sql, type SQL } from "drizzle-orm";
import { event } from "../db/schema.js";

/**
 * The one predicate every user surface uses to decide whether an event is "on"
 * in a lens window: the pin badge and lens hard-filter, the place panel's
 * programme, and the citywide what's-on (brief 19). One builder, three callers,
 * so the map, the panel and the list cannot disagree.
 *
 * It asks whether the event's span **overlaps** the window, not whether it
 * starts inside it. Asking "starts after now" made every event vanish from
 * every surface the minute it began, so a three-month exhibition was invisible
 * for its whole run, which is the opposite of the locked lifecycle (an event
 * leaves those surfaces when its *end* passes).
 *
 * **A null end date means a point event, on purpose.** Its span is its start, so
 * it stays visible until it starts and then drops out, exactly as before. Only
 * an event that says when it ends can be "running".
 *
 * Columns are interpolated from the schema, so in a correlated subquery they
 * resolve to the event table (the place table has no date columns).
 */
export function liveInWindow(from: string, to: string): SQL {
  return and(
    eq(event.status, "live"),
    lte(event.startDate, to),
    gte(sql`coalesce(${event.endDate}, ${event.startDate})`, from),
  )!;
}

/**
 * The archive's predicate (brief 14): the complement of `liveInWindow`'s end
 * test, from the same columns, so an event leaves what's-on exactly when it
 * enters the archive. Still `live` (a cancelled `ended` or a source-dropped
 * `stale` event did not happen as listed), and its end, or its start when it
 * has none, is behind `now`.
 */
export function pastAt(now: string): SQL {
  return and(eq(event.status, "live"), sql`coalesce(${event.endDate}, ${event.startDate}) < ${now}`)!;
}
