import { Link } from "react-router";
import { ArrowUpRight, MapPin } from "lucide-react";
import type { WhatsOnItem } from "@public-resource-map/shared";
import { useI18n } from "~/lib/i18n";
import { isRunning } from "~/lib/dates";
import { CategoryIcon, HuedIcon, eventCategoryKey, eventPlaceCategory } from "~/lib/categories";
import { sourceName } from "~/components/place/EventList";

/**
 * One event and the place it is at, linking to the place: the row of every
 * date-grouped list (what's on, the archive). Under a day heading the row
 * shows the time; under a month heading (the archive), the date.
 */
function EventPlaceRow({ item, when = "time" }: { item: WhatsOnItem; when?: "time" | "date" }) {
  const { t, time, dayMonth, lang } = useI18n();
  const { event, place } = item;
  const running = when === "time" && isRunning(event.startDate, event.endDate);
  const source = sourceName(event, lang);
  // A place OSM no longer has appears only in "my past events":
  // the row names it and says so, and links nowhere.
  const unlisted = place.listed === false;
  // "13 Nov" in Romanian, "Nov 13" in English: the number is the day, the other word the month.
  // A running event sits under "Today", so its tile shows today's date; "until" says when it ends.
  const parts = dayMonth(running ? new Date().toISOString() : event.startDate)
    .replace(".", "")
    .split(" ");
  const day = parts.find((part) => /^\d+$/.test(part)) ?? "";
  const month = parts.find((part) => part !== day) ?? "";
  const rowClass = "flex gap-3 py-3";
  const body = (
    <>
      <span className="flex h-[52px] w-11 shrink-0 flex-col items-center justify-center rounded-lg border border-line-strong bg-surface-2">
        <span className="text-field leading-[22px] font-semibold tnum">{day}</span>
        <span className="text-meta leading-3.5 text-fg-muted">{month}</span>
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-field leading-[22px] font-semibold text-fg md:text-body md:leading-5">
          {event.title}
        </span>

        <span className="flex flex-wrap items-center gap-x-3 text-ui text-fg-muted">
          <span className="font-medium text-fg tnum">
            {running && event.endDate ? t("event.until", { date: dayMonth(event.endDate) }) : time(event.startDate)}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1.5">
            <HuedIcon category={eventPlaceCategory(event.category)} />
            {t(eventCategoryKey(event.category))}
          </span>
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <CategoryIcon category={place.category} size={14} className="shrink-0" strokeWidth={2.2} />
            <span>{place.name}</span>
          </span>
        </span>

        {unlisted && <span className="block text-meta text-fg-faint">{t("place.unlisted")}</span>}

        {/* Text, not a link: the whole row already links to the place,
            whose panel links the original listing. */}
        <span className="flex items-center justify-between gap-2 text-meta text-fg-faint">
          <span>{source && `${t("event.source")} ${source}`}</span>
          {/* Tickets to something already over are noise: not in the archive. */}
          {event.buyUrl && when === "time" && (
            <span className="inline-flex shrink-0 items-center gap-1 text-ui font-medium text-accent">
              {t("event.tickets")}
              <ArrowUpRight size={13} strokeWidth={2.5} />
            </span>
          )}
        </span>
      </span>

      {!unlisted && <MapPin size={18} strokeWidth={2} className="mt-1 shrink-0 text-fg" aria-hidden="true" />}
    </>
  );

  return (
    <li className="border-t border-line first:border-t-0">
      {unlisted ? (
        <div className={rowClass}>{body}</div>
      ) : (
        <Link to={`/places/${place.id}`} className={`${rowClass} rounded-lg transition-colors hover:bg-surface-2`}>
          {body}
        </Link>
      )}
    </li>
  );
}

/** Day or month groups in one raised card, each under a strip with its count. */
export function GroupedEventCard({
  groups,
  when = "time",
}: {
  groups: { key: string; label: string; items: WhatsOnItem[] }[];
  when?: "time" | "date";
}) {
  const { tn } = useI18n();
  return (
    <div className="overflow-hidden rounded-xl border border-line-strong bg-surface shadow-e2">
      {groups.map((g, i) => (
        <section key={g.key}>
          <h2
            className={`m-0 flex items-baseline justify-between border-b border-line-strong bg-surface-2 px-3 py-2 md:px-4 ${i > 0 ? "border-t" : ""}`}
          >
            <span className="text-ui font-semibold">{g.label}</span>
            <span className="text-meta font-normal text-fg-muted tnum">{tn("count.events", g.items.length)}</span>
          </h2>
          <ul className="m-0 list-none px-3 py-0 md:px-4">
            {g.items.map((item) => (
              <EventPlaceRow key={item.event.id} item={item} when={when} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
