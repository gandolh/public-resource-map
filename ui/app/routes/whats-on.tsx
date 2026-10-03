import { Link, type MetaFunction } from "react-router";
import { AlertTriangle, CalendarOff, X } from "lucide-react";
import { useI18n } from "~/lib/i18n";
import { groupByDay } from "~/lib/dates";
import { inArea } from "~/lib/area";
import { usingCarto } from "~/lib/map";
import { categoryColor, categoryLabelKey } from "~/lib/categories";
import { useAppStore } from "~/stores/appStore";
import { useWhatsOn } from "~/hooks/usePlaces";
import { Segmented } from "~/components/ui/Segmented";
import { Chip } from "~/components/ui/Chip";
import { Button } from "~/components/ui/Button";
import { StateBlock } from "~/components/ui/StateBlock";
import { Skeleton } from "~/components/ui/Skeleton";
import { useLensOptions } from "~/components/map/FilterBar";
import { EventPlaceRow } from "~/components/place/EventPlaceRow";
import { placeCategories } from "@public-resource-map/shared";

export const meta: MetaFunction = () => [
  { title: "Ce se întâmplă — CivicMap" },
  { name: "description", content: "Tot ce urmează la locurile publice din oraș." },
];

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
  const area = useAppStore((s) => s.area);
  const clearArea = useAppStore((s) => s.clearArea);

  const { data, isPending, isError, refetch } = useWhatsOn({
    city: city.name,
    categories,
    lens,
    everything: area !== null,
  });
  // The map's drawn area applies here too (brief 15): the same filters, always.
  const items = (data?.data ?? []).filter((i) => inArea(i.place.coordinates, area));
  const total = area ? items.length : (data?.total ?? 0);
  const groups = groupByDay(items, (i) => ({ start: i.event.startDate, end: i.event.endDate }));

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
          {area && (
            <Chip active onClick={clearArea} aria-label={t("area.remove")} className="w-fit">
              {t("area.chip")}
              <X size={13} strokeWidth={2.4} aria-hidden="true" />
            </Chip>
          )}
        </div>

        {!isPending && !isError && items.length > 0 && (
          <p className="tnum mt-4 text-[12.5px] text-fg-muted">{tn("count.events", total)}</p>
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
                  <EventPlaceRow key={item.event.id} item={item} />
                ))}
              </ul>
            </section>
          ))}
        </div>

        <p className="mt-10 border-t border-line pt-4 text-[11.5px] leading-relaxed text-fg-faint">
          <Link to="/archive" className="underline underline-offset-2 hover:text-fg">
            {t("archive.link")}
          </Link>{" "}
          · {t("place.sourceOsm")} (ODbL){usingCarto && " · CARTO"} ·{" "}
          <Link to="/about-data" className="underline underline-offset-2 hover:text-fg">
            {t("nav.aboutData")}
          </Link>
        </p>
      </div>
    </div>
  );
}
