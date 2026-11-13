import { Link, type MetaFunction } from "react-router";
import { AlertTriangle, CalendarOff, X } from "lucide-react";
import { useI18n } from "~/lib/i18n";
import { groupByDay } from "~/lib/dates";
import { inArea } from "~/lib/area";
import { usingCarto } from "~/lib/map";
import { useAppStore } from "~/stores/appStore";
import { useWhatsOn } from "~/hooks/usePlaces";
import { Chip } from "~/components/ui/Chip";
import { Button } from "~/components/ui/Button";
import { StateBlock } from "~/components/ui/StateBlock";
import { Skeleton } from "~/components/ui/Skeleton";
import { FilterBar } from "~/components/map/FilterBar";
import { GroupedEventCard } from "~/components/place/EventPlaceRow";

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
  const lens = useAppStore((s) => s.lens);
  const area = useAppStore((s) => s.area);
  const clearArea = useAppStore((s) => s.clearArea);

  const { data, isPending, isError, refetch } = useWhatsOn({
    city: city.name,
    categories,
    lens,
    everything: area !== null,
  });
  // The map's drawn area applies here too: the same filters, always.
  const items = (data?.data ?? []).filter((i) => inArea(i.place.coordinates, area));
  const total = area ? items.length : (data?.total ?? 0);
  const groups = groupByDay(items, (i) => ({ start: i.event.startDate, end: i.event.endDate }));

  return (
    <div className="flex h-full flex-col">
      <FilterBar
        variant="whats-on"
        counts={{ places: isPending || isError ? null : tn("count.events", total), events: null }}
        placeCount={null}
      />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[880px] px-3 pt-5 pb-6 md:px-4 md:pt-7 md:pb-10">
          <header className="mb-4">
            <h1 className="text-hero font-semibold tracking-[-0.015em] text-balance">
              {t("whatsOn.title", { city: city.name })}
            </h1>
            <p className="mt-1 text-body text-fg-muted">{t("whatsOn.subtitle")}</p>
          </header>

          {area && (
            <Chip active onClick={clearArea} aria-label={t("area.remove")} className="mb-4 w-fit">
              {t("area.chip")}
              <X size={13} strokeWidth={2.4} aria-hidden="true" />
            </Chip>
          )}

          {isPending && (
            <div className="space-y-4 rounded-xl border border-line-strong bg-surface p-4 shadow-e2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-[52px] w-11 shrink-0" />
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
                  className="inline-flex h-10 items-center rounded-lg border border-outline bg-surface px-3.5 text-body font-medium transition-colors hover:bg-surface-2"
                >
                  {t("place.backToMap")}
                </Link>
              }
            />
          )}

          {groups.length > 0 && (
            <GroupedEventCard
              groups={groups.map(({ group, items: rows }) => ({ key: group, label: t(`group.${group}`), items: rows }))}
            />
          )}

          <p className="mt-10 border-t border-line pt-4 text-meta text-fg-muted">
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
    </div>
  );
}
