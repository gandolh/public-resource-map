import { useState } from "react";
import { ArrowUpRight, CalendarOff } from "lucide-react";
import type { Event } from "@public-resource-map/shared";
import { useI18n } from "~/lib/i18n";
import { groupByDay } from "~/lib/dates";
import { eventCategoryColor, eventCategoryKey } from "~/lib/categories";
import { Button } from "~/components/ui/Button";
import { StateBlock } from "~/components/ui/StateBlock";
import { EventRowSkeleton } from "~/components/ui/Skeleton";

const INITIAL = 5;

function EventRow({ event }: { event: Event }) {
  const { t, time, dayMonth } = useI18n();
  const [day, month] = dayMonth(event.startDate).replace(".", "").split(" ");
  const color = eventCategoryColor(event.category);

  return (
    <li className="flex gap-3 border-t border-line py-3 first:border-t-0">
      <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-surface-2">
        <span className="tnum text-[15px] leading-none font-semibold tracking-[-0.02em]">
          {day}
        </span>
        <span className="mt-0.5 text-[9.5px] leading-none font-medium tracking-[0.06em] text-fg-faint uppercase">
          {month}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] leading-snug font-semibold tracking-[-0.005em] text-fg">
          {event.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-fg-muted">
          <span className="tnum">{time(event.startDate)}</span>
          <span aria-hidden="true" className="text-fg-faint">·</span>
          <span className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: color }}
            />
            {t(eventCategoryKey(event.category))}
          </span>
        </div>

        {/* A ticket link exists only when the publisher provided one. We never
            manufacture one, so "no ticket link" is stated rather than implied. */}
        {event.buyUrl ? (
          <a
            href={event.buyUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-1.5 inline-flex items-center gap-1 rounded text-[12px] font-semibold text-accent hover:underline"
          >
            {t("event.tickets")}
            <ArrowUpRight size={13} strokeWidth={2.5} />
          </a>
        ) : (
          <p className="mt-1.5 text-[11.5px] text-fg-faint">{t("event.noTicketLink")}</p>
        )}
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
      <div className="px-4">
        <EventRowSkeleton />
        <EventRowSkeleton />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <StateBlock
        icon={<CalendarOff size={18} strokeWidth={2} />}
        title={emptyTitle}
        body={emptyBody}
      />
    );
  }

  const shown = expanded ? events : events.slice(0, INITIAL);
  const groups = groupByDay(shown, (e) => e.startDate);

  return (
    <div className="px-4 pb-1">
      {groups.map(({ group, items }) => (
        <section key={group} className="mb-1 last:mb-0">
          <h4 className="label-cap pt-3 pb-1">
            {t(`group.${group}`)}
          </h4>
          <ul>
            {items.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </ul>
        </section>
      ))}

      {events.length > INITIAL && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 w-full"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? t("place.showLess") : t("place.showAll", { n: events.length })}
        </Button>
      )}

      <p className="sr-only">{tn("count.events", events.length)}</p>
    </div>
  );
}
