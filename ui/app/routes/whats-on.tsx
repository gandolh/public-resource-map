import { Link, type MetaFunction } from "react-router";
import { AlertTriangle, ArrowUpRight, CalendarOff, MapPin } from "lucide-react";
import type { WhatsOnItem } from "@public-resource-map/shared";
import { useI18n } from "~/lib/i18n";
import { groupByDay } from "~/lib/dates";
import {
  categoryColor,
  categoryLabelKey,
  eventCategoryColor,
  eventCategoryKey,
  CategoryIcon,
} from "~/lib/categories";
import { useAppStore } from "~/stores/appStore";
import { useWhatsOn } from "~/hooks/usePlaces";
import { Segmented } from "~/components/ui/Segmented";
import { Chip } from "~/components/ui/Chip";
import { Button } from "~/components/ui/Button";
import { StateBlock } from "~/components/ui/StateBlock";
import { Skeleton } from "~/components/ui/Skeleton";
import { useLensOptions } from "~/components/map/FilterBar";
import { placeCategories } from "@public-resource-map/shared";

export const meta: MetaFunction = () => [
  { title: "Ce se întâmplă — CivicMap" },
  { name: "description", content: "Tot ce urmează la locurile publice din oraș." },
];

function Row({ item }: { item: WhatsOnItem }) {
  const { t, time } = useI18n();
  const { event, place } = item;

  return (
    <li className="border-t border-line first:border-t-0">
      <Link
        to={`/places/${place.id}`}
        className="flex gap-3.5 py-3.5 transition-colors hover:bg-surface-2 md:gap-4 md:px-2 md:-mx-2 md:rounded-lg"
      >
        <span className="tnum w-12 shrink-0 pt-0.5 text-[13.5px] font-semibold tracking-[-0.01em] text-fg">
          {time(event.startDate)}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-[14.5px] leading-snug font-semibold tracking-[-0.01em] text-fg">
            {event.title}
          </span>

          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-fg-muted">
            <span className="inline-flex items-center gap-1.5">
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

          {event.buyUrl && (
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

/**
 * The citywide index — a date-first lens on exactly what the map shows. It
 * honours the same city, chips and timing lens, and every row links back to
 * its place, so this is never a second, competing model of the data.
 */
export default function WhatsOnRoute() {
  const { t, tn } = useI18n();
  const city = useAppStore((s) => s.city);
  const categories = useAppStore((s) => s.categories);
  const toggleCategory = useAppStore((s) => s.toggleCategory);
  const clearCategories = useAppStore((s) => s.clearCategories);
  const lens = useAppStore((s) => s.lens);
  const setLens = useAppStore((s) => s.setLens);
  const lensOptions = useLensOptions();

  const { data, isPending, isError, refetch } = useWhatsOn({ city: city.name, categories, lens });
  const items = data?.data ?? [];
  const groups = groupByDay(items, (i) => i.event.startDate);

  return (
    <div className="h-full overflow-y-auto pb-20 md:pb-8">
      <div className="mx-auto w-full max-w-[720px] px-4 py-6 md:px-6 md:py-8">
        <header>
          <h1 className="text-[26px] leading-[1.15] font-semibold tracking-[-0.025em] text-balance md:text-[30px]">
            {t("whatsOn.title", { city: city.name })}
          </h1>
          <p className="mt-1.5 text-[14px] text-fg-muted">{t("whatsOn.subtitle")}</p>
        </header>

        <div className="mt-5 flex flex-col gap-3">
          <Segmented value={lens} options={lensOptions} onChange={setLens} label={t("lens.label")} />
          <div className="scroll-fade-x -mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex gap-1.5">
              <Chip active={categories.length === 0} onClick={clearCategories}>
                {t("filters.all")}
              </Chip>
              {placeCategories.map((category) => (
                <Chip
                  key={category}
                  active={categories.includes(category)}
                  dotColor={categoryColor(category)}
                  onClick={() => toggleCategory(category)}
                >
                  {t(categoryLabelKey(category))}
                </Chip>
              ))}
            </div>
          </div>
        </div>

        {!isPending && !isError && items.length > 0 && (
          <p className="tnum mt-4 text-[12.5px] text-fg-muted">{tn("count.events", data!.total)}</p>
        )}

        <div className="mt-2">
          {isPending && (
            <div className="space-y-4 pt-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-4 w-10 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {isError && (
            <StateBlock
              tone="danger"
              icon={<AlertTriangle size={18} strokeWidth={2} />}
              title={t("state.error")}
              body={t("state.errorBody")}
              action={
                <Button variant="secondary" size="sm" onClick={() => void refetch()}>
                  {t("state.retry")}
                </Button>
              }
            />
          )}

          {!isPending && !isError && items.length === 0 && (
            <StateBlock
              icon={<CalendarOff size={18} strokeWidth={2} />}
              title={t("whatsOn.empty")}
              body={t("whatsOn.emptyBody")}
              action={
                <Link
                  to="/"
                  className="inline-flex h-9 items-center rounded-lg border border-line bg-surface px-3.5 text-[13.5px] font-medium transition-colors hover:bg-surface-2"
                >
                  {t("place.backToMap")}
                </Link>
              }
            />
          )}

          {groups.map(({ group, items: rows }) => (
            <section key={group} className="mt-5 first:mt-3">
              <h2 className="label-cap pb-1">
                {t(`group.${group}`)}
              </h2>
              <ul>
                {rows.map((item) => (
                  <Row key={item.event.id} item={item} />
                ))}
              </ul>
            </section>
          ))}
        </div>

        <p className="mt-10 border-t border-line pt-4 text-[11.5px] leading-relaxed text-fg-faint">
          {t("place.sourceOsm")} (ODbL) · CARTO
        </p>
      </div>
    </div>
  );
}
