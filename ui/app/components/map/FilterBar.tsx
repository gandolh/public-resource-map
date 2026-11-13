import { useState } from "react";
import { CalendarDays, ChevronDown, LassoSelect, SlidersHorizontal, X } from "lucide-react";
import { placeCategories, type EventLens, type PlaceCategory } from "@public-resource-map/shared";
import { useI18n } from "~/lib/i18n";
import { HuedIcon, categoryLabelKey } from "~/lib/categories";
import { useAppStore } from "~/stores/appStore";
import { Chip } from "~/components/ui/Chip";
import { Segmented } from "~/components/ui/Segmented";
import { SearchInput } from "~/components/ui/SearchInput";
import { Button } from "~/components/ui/Button";
import { Dialog } from "~/components/ui/Dialog";
import { DropdownMenu, DropdownMenuRadioGroup, DropdownMenuRadioItem } from "~/components/ui/DropdownMenu";
import { cn } from "~/lib/utils";

/** The categories a Romanian city actually has a lot of, first. */
const PRIMARY: PlaceCategory[] = ["park", "library", "museum", "townhall", "education", "clinic"];
const SECONDARY = placeCategories.filter((c) => !PRIMARY.includes(c));

export function useLensOptions() {
  const { t } = useI18n();
  return [
    { value: "today" as EventLens, label: t("lens.today") },
    { value: "weekend" as EventLens, label: t("lens.weekend") },
    { value: "all" as EventLens, label: t("lens.all") },
  ];
}

/**
 * The categories as chips, each with its glyph in its hue. `layout` says how the
 * row sits: `wrap` on the desktop band (the commonest six, then `+N`), `scroll`
 * in the phone's sideways row (all eleven), `sheet` in the Categories sheet.
 */
function CategoryChips({ layout }: { layout: "wrap" | "scroll" | "sheet" }) {
  const { t } = useI18n();
  const categories = useAppStore((s) => s.categories);
  const toggleCategory = useAppStore((s) => s.toggleCategory);
  const clearCategories = useAppStore((s) => s.clearCategories);
  const [showAll, setShowAll] = useState(false);

  const visible = layout === "wrap" && !showAll ? PRIMARY : [...PRIMARY, ...SECONDARY];

  return (
    <div
      className={cn(
        "flex gap-1.5 md:gap-1.5",
        layout === "scroll" && "flex-nowrap gap-2",
        layout === "wrap" && "flex-wrap",
        layout === "sheet" && "flex-wrap gap-2",
      )}
    >
      <Chip active={categories.length === 0} onClick={clearCategories}>
        {t("filters.all")}
      </Chip>
      {visible.map((category) => (
        <Chip
          key={category}
          active={categories.includes(category)}
          icon={<HuedIcon category={category} />}
          onClick={() => toggleCategory(category)}
        >
          {t(categoryLabelKey(category))}
        </Chip>
      ))}
      {layout === "wrap" && (
        <Chip
          active={false}
          onClick={() => setShowAll((v) => !v)}
          aria-label={showAll ? t("filters.showLess") : t("filters.moreLabel", { n: SECONDARY.length })}
        >
          {showAll ? t("filters.showLess") : t("filters.more", { n: SECONDARY.length })}
        </Chip>
      )}
    </div>
  );
}

/**
 * Draw-to-filter's entry point: "Draw an area" until there is one,
 * then the area as a removable filter chip, plus a redraw.
 */
function AreaControls({ onStart, className }: { onStart?: () => void; className?: string }) {
  const { t } = useI18n();
  const area = useAppStore((s) => s.area);
  const clearArea = useAppStore((s) => s.clearArea);
  const setDrawMode = useAppStore((s) => s.setDrawMode);
  const start = () => {
    onStart?.();
    setDrawMode("freehand");
  };

  if (!area) {
    return (
      <Button variant="secondary" size="sm" onClick={start} className={className}>
        <LassoSelect size={15} strokeWidth={2} className="text-fg-muted" />
        {t("area.draw")}
      </Button>
    );
  }
  return (
    <div className="flex items-center gap-1.5">
      <Chip active onClick={clearArea} aria-label={t("area.remove")}>
        {t("area.chip")}
        <X size={13} strokeWidth={2.4} aria-hidden="true" />
      </Chip>
      <Button variant="secondary" size="sm" onClick={start}>
        {t("area.redraw")}
      </Button>
    </div>
  );
}

/**
 * While a timing lens is on, say so: it removes places rather than
 * dimming them, so the map must state what it is hiding and offer the way back.
 */
function LensBanner({ placeCount, className }: { placeCount: number | null; className?: string }) {
  const { t, tn } = useI18n();
  const lens = useAppStore((s) => s.lens);
  const setLens = useAppStore((s) => s.setLens);
  if (lens === "all" || placeCount === null) return null;
  const key = lens === "today" ? "lens.bannerToday" : "lens.bannerWeekend";
  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto flex w-fit items-center gap-2 rounded-lg border border-accent-line bg-accent-weak py-1 pr-1 pl-3 text-ui text-fg shadow-e2",
        className,
      )}
    >
      <span className="tnum">{t(key, { places: tn("count.places", placeCount) })}</span>
      <button
        type="button"
        onClick={() => setLens("all")}
        className="rounded-md px-2 py-1 font-semibold text-accent transition-colors hover:bg-surface"
      >
        {t("lens.showAll")}
      </button>
    </div>
  );
}

/** "124 places" with its number set heavier, as the band states it. */
function Count({ text }: { text: string }) {
  const [n, ...rest] = text.split(" ");
  return (
    <span>
      <b className="font-semibold text-fg">{n}</b> {rest.join(" ")}
    </span>
  );
}

export interface BandCounts {
  /** "124 places", or "12 places in this area"; null while loading. */
  places: string | null;
  /** "2 with events". */
  events: string | null;
}

/** The count and Draw an area: the band's right-hand tools. */
function Tools({ counts, drawable, className }: { counts: BandCounts; drawable: boolean; className?: string }) {
  const { t } = useI18n();
  return (
    <div className={cn("ml-auto items-center gap-4", className)}>
      <p className="flex items-center gap-4 text-meta whitespace-nowrap text-fg-muted tnum">
        {counts.places === null ? (
          <span>{t("state.loading")}</span>
        ) : (
          <>
            <Count text={counts.places} />
            {counts.events && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={14} strokeWidth={2} aria-hidden="true" className="text-accent" />
                {counts.events}
              </span>
            )}
          </>
        )}
      </p>
      {drawable && <AreaControls />}
    </div>
  );
}

/** The phone's timing lens: one compact chip that opens the three choices. */
function LensChip() {
  const { t } = useI18n();
  const lens = useAppStore((s) => s.lens);
  const setLens = useAppStore((s) => s.setLens);
  const options = useLensOptions();
  return (
    <DropdownMenu
      align="start"
      trigger={
        <button
          type="button"
          aria-label={t("lens.chip", { lens: t(`lens.${lens}`) })}
          className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-[10px] border border-outline bg-surface px-3.5 text-body font-medium text-fg transition-colors hover:bg-surface-2"
        >
          {t(`lens.${lens}`)}
          <ChevronDown size={14} strokeWidth={2.2} aria-hidden="true" className="text-fg-muted" />
        </button>
      }
    >
      <DropdownMenuRadioGroup value={lens} onValueChange={(value) => setLens(value as EventLens)}>
        {options.map((option) => (
          <DropdownMenuRadioItem key={option.value} value={option.value}>
            {option.label}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </DropdownMenu>
  );
}

/** The phone's Categories sheet: every category, Draw an area, Clear filters and Done. */
function CategoriesSheet({
  open,
  onOpenChange,
  count,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  count: number;
}) {
  const { t } = useI18n();
  const clearFilters = useAppStore((s) => s.clearFilters);
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      placement="bottom"
      closeLabel={t("admin.close")}
      title={
        <span className="flex items-center gap-2">
          {t("filters.title")}
          {count > 0 && (
            <span className="min-w-5 rounded-full bg-accent px-1.5 text-center text-meta font-semibold text-fg-on-accent tnum">
              {count}
            </span>
          )}
        </span>
      }
      bodyClassName="px-4 py-3"
      footer={
        <>
          <Button variant="secondary" size="lg" className="flex-1 text-body" onClick={clearFilters}>
            {t("filters.clear")}
          </Button>
          <Button variant="primary" size="lg" className="flex-1 text-body" onClick={() => onOpenChange(false)}>
            {t("area.done")}
          </Button>
        </>
      }
    >
      <CategoryChips layout="sheet" />
      <AreaControls onStart={() => onOpenChange(false)} className="mt-3 h-12 w-full" />
    </Dialog>
  );
}

/**
 * The docked band above the map (and What's on): search, the timing lens, the
 * category chips, the count and Draw an area, in two rows on a desktop. On a
 * phone, search and Categories sit in row one, and one sideways row holds the
 * lens chip, the count and the chips; What's on gives the lens its own row.
 */
export function FilterBar({
  variant = "map",
  counts,
  placeCount,
}: {
  variant?: "map" | "whats-on";
  counts: BandCounts;
  /** Places on the map now, or null while loading; the lens banner states it. */
  placeCount: number | null;
}) {
  const { t } = useI18n();
  const search = useAppStore((s) => s.search);
  const setSearch = useAppStore((s) => s.setSearch);
  const lens = useAppStore((s) => s.lens);
  const setLens = useAppStore((s) => s.setLens);
  const lensOptions = useLensOptions();
  const categories = useAppStore((s) => s.categories);
  const area = useAppStore((s) => s.area);
  const drawing = useAppStore((s) => s.drawMode !== null);
  const [sheet, setSheet] = useState(false);
  const hiddenFilters = categories.length + (area ? 1 : 0);
  const onMap = variant === "map";

  // While drawing, the draw bar is the only chrome: the map is the canvas.
  if (drawing) return null;

  const lensControl = (
    <Segmented value={lens} options={lensOptions} onChange={setLens} label={t("lens.label")} className="shrink-0" />
  );

  return (
    <div className="relative z-chrome flex shrink-0 flex-col gap-2 border-b border-line bg-surface py-2 shadow-e1 md:px-4">
      {onMap ? (
        <>
          {/* Desktop: row one */}
          <div className="hidden h-10 items-center gap-4 md:flex">
            <div className="w-[360px] shrink-0">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={t("search.placeholder")}
                clearLabel={t("search.clear")}
              />
            </div>
            {lensControl}
            <Tools counts={counts} drawable className="hidden max-[1239px]:flex" />
          </div>

          {/* Desktop: row two */}
          <div className="hidden flex-wrap items-center gap-x-4 gap-y-2 md:flex">
            <CategoryChips layout="wrap" />
            <Tools counts={counts} drawable className="flex max-[1239px]:hidden" />
          </div>
        </>
      ) : (
        /* What's on: the same band in one row, the lens first. */
        <div className="hidden flex-wrap items-center gap-x-4 gap-y-2 md:flex">
          {lensControl}
          <CategoryChips layout="wrap" />
          <Tools counts={counts} drawable={false} className="flex" />
        </div>
      )}

      {/* Phone */}
      <div className="flex flex-col gap-2 md:hidden">
        {onMap && (
          <div className="flex h-11 items-center gap-2 px-3">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t("search.placeholder")}
              clearLabel={t("search.clear")}
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => setSheet(true)}
              aria-label={hiddenFilters > 0 ? t("filters.titleCount", { n: hiddenFilters }) : t("filters.title")}
              className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-outline bg-surface px-3 text-ui font-medium text-fg transition-colors hover:bg-surface-2"
            >
              <SlidersHorizontal size={16} strokeWidth={2} aria-hidden="true" className="text-fg-muted" />
              {t("filters.title")}
              {hiddenFilters > 0 && (
                <span className="min-w-5 rounded-full bg-accent px-1.5 text-center text-meta font-semibold text-fg-on-accent tnum">
                  {hiddenFilters}
                </span>
              )}
            </button>
          </div>
        )}
        {!onMap && <div className="px-3">{lensControl}</div>}
        <div className="flex [scrollbar-width:none] items-center gap-2 overflow-x-auto scroll-fade-x pr-7 pl-3 [&::-webkit-scrollbar]:hidden">
          {onMap && <LensChip />}
          {onMap && (
            <p className="flex shrink-0 flex-col text-meta whitespace-nowrap text-fg-muted tnum">
              {counts.places === null ? (
                <span>{t("state.loading")}</span>
              ) : (
                <>
                  <Count text={counts.places} />
                  {counts.events && <span>{counts.events}</span>}
                </>
              )}
            </p>
          )}
          <CategoryChips layout="scroll" />
        </div>
      </div>

      {onMap && (
        <LensBanner
          placeCount={placeCount}
          className="mx-3 text-meta md:absolute md:top-full md:left-1/2 md:mx-0 md:mt-3 md:-translate-x-1/2"
        />
      )}
      {onMap && <CategoriesSheet open={sheet} onOpenChange={setSheet} count={hiddenFilters} />}
    </div>
  );
}
