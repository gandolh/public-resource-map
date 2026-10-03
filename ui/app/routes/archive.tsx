import { useMemo, useState } from "react";
import type { MetaFunction } from "react-router";
import { AlertTriangle, Archive, Loader2 } from "lucide-react";
import { eventCategories, type WhatsOnItem } from "@public-resource-map/shared";
import { APP_TZ, useI18n } from "~/lib/i18n";
import { eventCategoryColor, eventCategoryKey } from "~/lib/categories";
import { wardLoginUrl } from "~/lib/authApi";
import { useAppStore } from "~/stores/appStore";
import { useAuthStore } from "~/stores/authStore";
import { useCityArchive, useMyArchive } from "~/hooks/useArchive";
import { EventPlaceRow } from "~/components/place/EventPlaceRow";
import { Button } from "~/components/ui/Button";
import { Chip } from "~/components/ui/Chip";
import { Skeleton } from "~/components/ui/Skeleton";
import { StateBlock } from "~/components/ui/StateBlock";
import { cn } from "~/lib/utils";

export const meta: MetaFunction = () => [
  { title: "Arhivă — CivicMap" },
  { name: "description", content: "Ce s-a întâmplat la locurile publice din oraș, și unde." },
];

type Tab = "mine" | "city";

/** Month groups, newest first: an archive is read by "when", in larger steps than a week. */
function byMonth(items: WhatsOnItem[], lang: string) {
  const label = new Intl.DateTimeFormat(lang, { month: "long", year: "numeric", timeZone: APP_TZ });
  const key = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", timeZone: APP_TZ });
  const groups = new Map<string, { label: string; items: WhatsOnItem[] }>();
  for (const item of items) {
    const ended = item.event.endDate ?? item.event.startDate;
    const k = key.format(new Date(ended));
    if (!groups.has(k)) groups.set(k, { label: label.format(new Date(ended)), items: [] });
    groups.get(k)!.items.push(item);
  }
  return [...groups.entries()].map(([k, g]) => ({ key: k, ...g }));
}

/**
 * The archive (brief 14): what happened, and where. Past events are kept, not
 * deleted, so each row still opens its place. "My past events" is the events
 * you saved and those at places you follow; the citywide tab follows the city
 * picker. Signed out, only the citywide tab has content.
 */
export default function ArchiveRoute() {
  const { t, tn, lang } = useI18n();
  const city = useAppStore((s) => s.city);
  const signedIn = useAuthStore((s) => s.status === "authenticated" && s.user !== null);
  const [chosenTab, setTab] = useState<Tab | null>(null);
  const tab: Tab = chosenTab ?? (signedIn ? "mine" : "city");
  const [categories, setCategories] = useState<string[]>([]);

  const cityQuery = useCityArchive(city.name, categories, tab === "city");
  const mineQuery = useMyArchive(categories, tab === "mine" && signedIn);
  const q = tab === "city" ? cityQuery : mineQuery;
  const items = useMemo(() => q.data?.pages.flatMap((p) => p.data) ?? [], [q.data]);
  const total = q.data?.pages[0]?.total ?? 0;
  const groups = useMemo(() => byMonth(items, lang), [items, lang]);

  const toggle = (c: string) =>
    setCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const tabButton = (id: Tab, label: string) => (
    <button
      type="button"
      role="tab"
      id={`archive-tab-${id}`}
      aria-selected={tab === id}
      aria-controls="archive-panel"
      onClick={() => setTab(id)}
      className={cn(
        "-mb-px border-b-2 px-1 pb-2 text-[14px] font-medium transition-colors",
        tab === id ? "border-accent text-fg" : "border-transparent text-fg-muted hover:text-fg",
      )}
    >
      {label}
    </button>
  );

  const needsSignIn = tab === "mine" && !signedIn;

  return (
    <div className="h-full overflow-y-auto pb-20 md:pb-8">
      <div className="mx-auto w-full max-w-[720px] px-4 py-6 md:px-6 md:py-8">
        <header>
          <h1 className="text-[26px] leading-[1.15] font-semibold tracking-[-0.025em] md:text-[30px]">
            {t("archive.title")}
          </h1>
          <p className="mt-1.5 text-[14px] text-fg-muted">{t("archive.subtitle")}</p>
        </header>

        <div role="tablist" aria-label={t("archive.title")} className="mt-5 flex gap-5 border-b border-line">
          {tabButton("mine", t("archive.mine"))}
          {tabButton("city", t("archive.city", { city: city.name }))}
        </div>

        <div id="archive-panel" role="tabpanel" aria-labelledby={`archive-tab-${tab}`}>
          {!needsSignIn && (
            <div className="scroll-fade-x -mx-4 mt-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex gap-1.5">
                <Chip active={categories.length === 0} onClick={() => setCategories([])}>
                  {t("filters.all")}
                </Chip>
                {eventCategories.map((c) => (
                  <Chip key={c} active={categories.includes(c)} dotColor={eventCategoryColor(c)} onClick={() => toggle(c)}>
                    {t(eventCategoryKey(c))}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {needsSignIn && (
            <StateBlock
              icon={<Archive size={18} strokeWidth={2} />}
              title={t("archive.mineSignIn")}
              body={t("archive.mineSignInBody")}
              action={
                <a
                  href={wardLoginUrl(`${import.meta.env.BASE_URL}archive`)}
                  className="inline-flex h-9 items-center rounded-lg bg-accent px-3.5 text-[13.5px] font-medium text-fg-on-accent"
                >
                  {t("nav.login")}
                </a>
              }
            />
          )}

          {!needsSignIn && q.isPending && (
            <div className="space-y-4 pt-6" aria-label={t("state.loading")}>
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

          {!needsSignIn && q.isError && (
            <StateBlock
              tone="danger"
              icon={<AlertTriangle size={18} strokeWidth={2} />}
              title={t("state.error")}
              body={t("state.errorBody")}
              action={
                <Button variant="secondary" size="sm" onClick={() => void q.refetch()}>
                  {t("state.retry")}
                </Button>
              }
            />
          )}

          {!needsSignIn && !q.isPending && !q.isError && items.length === 0 && (
            <StateBlock
              icon={<Archive size={18} strokeWidth={2} />}
              title={tab === "mine" ? t("archive.mineEmpty") : t("archive.cityEmpty", { city: city.name })}
              body={tab === "mine" ? t("archive.mineEmptyBody") : t("archive.cityEmptyBody")}
            />
          )}

          {items.length > 0 && (
            <>
              <p className="tnum mt-4 text-[12.5px] text-fg-muted">{tn("count.events", total)}</p>
              {groups.map((g) => (
                <section key={g.key} className="mt-5 first:mt-3">
                  <h2 className="label-cap pb-1">{g.label}</h2>
                  <ul>
                    {g.items.map((item) => (
                      <EventPlaceRow key={item.event.id} item={item} when="date" />
                    ))}
                  </ul>
                </section>
              ))}
              {q.hasNextPage && (
                <div className="mt-6 flex justify-center">
                  <Button variant="secondary" size="sm" disabled={q.isFetchingNextPage} onClick={() => void q.fetchNextPage()}>
                    {q.isFetchingNextPage && <Loader2 size={14} className="animate-spin" />}
                    {t("archive.more")}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
