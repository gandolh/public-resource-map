import { Link } from "react-router";
import { ArrowUpRight, MapPin } from "lucide-react";
import type { WhatsOnItem } from "@public-resource-map/shared";
import { useI18n } from "~/lib/i18n";
import { isRunning } from "~/lib/dates";
import { eventCategoryColor, eventCategoryKey, CategoryIcon } from "~/lib/categories";
import { sourceName } from "~/components/place/EventList";

/**
 * One event and the place it is at, linking to the place: the row of every
 * date-grouped list (what's on, the archive). Under a day heading the row
 * shows the time; under a month heading (the archive), the date.
 */
export function EventPlaceRow({ item, when = "time" }: { item: WhatsOnItem; when?: "time" | "date" }) {
  const { t, time, dayMonth } = useI18n();
  const { event, place } = item;
  const running = when === "time" && isRunning(event.startDate, event.endDate);
  const source = sourceName(event);

  return (
    <li className="border-t border-line first:border-t-0">
      <Link
        to={`/places/${place.id}`}
        className="flex gap-3.5 py-3.5 transition-colors hover:bg-surface-2 md:gap-4 md:px-2 md:-mx-2 md:rounded-lg"
      >
        {running ? (
          <span className="tnum w-12 shrink-0 pt-0.5 text-[11.5px] leading-tight font-semibold text-fg">
            {t("event.until", { date: dayMonth(event.endDate!) })}
          </span>
        ) : (
          <span className="tnum w-12 shrink-0 pt-0.5 text-[13.5px] font-semibold tracking-[-0.01em] text-fg">
            {when === "date" ? dayMonth(event.startDate) : time(event.startDate)}
          </span>
        )}

        <span className="min-w-0 flex-1">
          <span className="block text-[14.5px] leading-snug font-semibold tracking-[-0.01em] text-fg">
            {event.title}
          </span>

          {/* One line: wrapped, the "·" was left dangling at the end of the
              first. A long place name truncates instead (TP-04, brief 10). */}
          <span className="mt-1 flex items-center gap-x-2 text-[12.5px] text-fg-muted">
            <span className="inline-flex shrink-0 items-center gap-1.5">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: eventCategoryColor(event.category) }}
              />
              {t(eventCategoryKey(event.category))}
            </span>
            <span aria-hidden="true" className="text-fg-faint">·</span>
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <CategoryIcon
                category={place.category}
                size={13}
                className="shrink-0"
                strokeWidth={2.2}
              />
              <span className="truncate">{place.name}</span>
            </span>
          </span>

          {/* Text, not a link: the whole row already links to the place,
              whose panel links the original listing. */}
          {source && (
            <span className="mt-1 block text-[11.5px] text-fg-faint">
              {t("event.source")} {source}
            </span>
          )}

          {/* Tickets to something already over are noise: not in the archive. */}
          {event.buyUrl && when === "time" && (
            <span className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold text-accent">
              {t("event.tickets")}
              <ArrowUpRight size={12} strokeWidth={2.5} />
            </span>
          )}
        </span>

        <MapPin size={15} strokeWidth={2} className="mt-1 shrink-0 text-fg-faint" aria-hidden="true" />
      </Link>
    </li>
  );
}

