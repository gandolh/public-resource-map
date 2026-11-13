import { useState } from "react";
import { ArrowUpRight, CalendarOff } from "lucide-react";
import { sourceById, type Event } from "@public-resource-map/shared";
import { useI18n, type Lang } from "~/lib/i18n";
import { groupByDay, isRunning } from "~/lib/dates";
import { HuedIcon, eventCategoryKey, eventPlaceCategory } from "~/lib/categories";
import { Button } from "~/components/ui/Button";
import { FavoriteStar } from "~/components/FavoriteStar";
import { StateBlock } from "~/components/ui/StateBlock";
import { EventRowSkeleton } from "~/components/ui/Skeleton";

const INITIAL = 5;

/**
 * The publisher's credit from the source registry, or failing that the name the listing came
 * with, or its host.
 */
export function sourceName(event: Pick<Event, "credit" | "sourcePlatform" | "sourceUrl">, lang: Lang): string | null {
  const credited = event.credit ? sourceById(event.credit)?.attribution[lang] : undefined;
  if (credited) return credited;
  if (event.sourcePlatform) return event.sourcePlatform;
  if (!event.sourceUrl) return null;
  try {
    return new URL(event.sourceUrl).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** One event at a place: its date tile, title, time, category, who published it and where its tickets are. */
function EventRow({ event }: { event: Event }) {
  const { t, time, dayMonth, lang } = useI18n();
  // A running event sits under "Today", so its tile shows today's date; "until" says when it ends.
  const running = isRunning(event.startDate, event.endDate);
  // "13 Nov" in Romanian, "Nov 13" in English: the number is the day, the other word the month.
  const parts = dayMonth(running ? new Date().toISOString() : event.startDate)
    .replace(".", "")
    .split(" ");
  const day = parts.find((part) => /^\d+$/.test(part)) ?? "";
  const month = parts.find((part) => part !== day) ?? "";
  const name = sourceName(event, lang);

  return (
    <li className="flex gap-3 border-t border-line py-3 first:border-t-0">
      <div className="flex h-[52px] w-11 shrink-0 flex-col items-center justify-center rounded-lg border border-line-strong bg-surface-2">
        <span className="text-field leading-[22px] font-semibold tnum">{day}</span>
        <span className="text-meta leading-3.5 text-fg-muted">{month}</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-field leading-[22px] font-semibold text-fg md:text-body md:leading-5">{event.title}</p>
          <span className="-mt-2 -mr-1.5 shrink-0">
            <FavoriteStar kind="event" id={event.id} name={event.title} size="sm" />
          </span>
        </div>
        <p className="flex flex-wrap items-center gap-x-3 text-ui text-fg-muted">
          <span className="font-medium text-fg tnum">
            {running && event.endDate ? t("event.until", { date: dayMonth(event.endDate) }) : time(event.startDate)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <HuedIcon category={eventPlaceCategory(event.category)} />
            {t(eventCategoryKey(event.category))}
          </span>
        </p>

        <div className="flex items-center justify-between gap-2 text-meta text-fg-faint">
          <p>
            {name && (
              <>
                {t("event.source")}{" "}
                {event.sourceUrl ? (
                  <a
                    href={event.sourceUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="font-medium text-fg-muted underline decoration-line-strong underline-offset-2 hover:text-fg"
                  >
                    {name}
                  </a>
                ) : (
                  name
                )}
              </>
            )}
          </p>
          {/* A ticket link exists only when the publisher provided one. We never
              manufacture one, so "no ticket link" is stated rather than implied. */}
          {event.buyUrl ? (
            <a
              href={event.buyUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex min-h-6 shrink-0 items-center gap-1 text-ui font-medium text-accent hover:underline"
            >
              {t("event.tickets")}
              <ArrowUpRight size={13} strokeWidth={2.5} />
            </a>
          ) : (
            <span className="shrink-0">{t("event.noTicketLink")}</span>
          )}
        </div>
      </div>
    </li>
  );
}

interface EventListProps {
  events: Event[];
  loading?: boolean;
  /** Shown when the place has nothing on — the common case, not an edge case. */
  emptyTitle: string;
  emptyBody: string;
}

export function EventList({ events, loading, emptyTitle, emptyBody }: EventListProps) {
  const { t, tn } = useI18n();
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <div>
        <EventRowSkeleton />
        <EventRowSkeleton />
      </div>
    );
  }

  if (events.length === 0) {
    return <StateBlock icon={<CalendarOff size={18} strokeWidth={2} />} title={emptyTitle} body={emptyBody} />;
  }

  const shown = expanded ? events : events.slice(0, INITIAL);
  const groups = groupByDay(shown, (e) => ({ start: e.startDate, end: e.endDate }));

  return (
    <div>
      {groups.map(({ group, items }) => (
        <section key={group} className="mb-1 last:mb-0">
          <h4 className="mt-3 mb-1 text-meta font-medium text-fg-faint">{t(`group.${group}`)}</h4>
          <ul>
            {items.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </ul>
        </section>
      ))}

      {events.length > INITIAL && (
        <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => setExpanded((v) => !v)}>
          {expanded ? t("place.showLess") : t("place.showAll", { n: events.length })}
        </Button>
      )}

      <p className="sr-only">{tn("count.events", events.length)}</p>
    </div>
  );
}
