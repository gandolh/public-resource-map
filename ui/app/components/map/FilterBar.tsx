import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { placeCategories, type EventLens, type PlaceCategory } from "@public-resource-map/shared";
import { useI18n } from "~/lib/i18n";
import { categoryColor, categoryLabelKey } from "~/lib/categories";
import { useAppStore } from "~/stores/appStore";
import { Chip } from "~/components/ui/Chip";
import { Segmented } from "~/components/ui/Segmented";
import { SearchInput } from "~/components/ui/SearchInput";
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

function CategoryChips({ compact }: { compact?: boolean }) {
  const { t } = useI18n();
  const categories = useAppStore((s) => s.categories);
  const toggleCategory = useAppStore((s) => s.toggleCategory);
  const clearCategories = useAppStore((s) => s.clearCategories);
  const [showAll, setShowAll] = useState(false);

  const visible = showAll ? [...PRIMARY, ...SECONDARY] : PRIMARY;

  return (
    <div className={cn("flex gap-1.5", compact ? "flex-nowrap" : "flex-wrap")}>
      <Chip active={categories.length === 0} onClick={clearCategories}>
        {t("filters.all")}
      </Chip>
      {visible.map((category) => (
        <Chip
          key={category}
          active={categories.includes(category)}
          dotColor={categoryColor(category)}
          onClick={() => toggleCategory(category)}
        >
          {t(categoryLabelKey(category))}
        </Chip>
      ))}
      {!compact && (
        // Not a Chip: the pill shape is reserved for controls that filter, and
        // this one only discloses more of them.
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="inline-flex h-8 shrink-0 items-center rounded-md px-2 text-[12.5px] font-medium text-fg-muted underline decoration-line-strong underline-offset-[3px] transition-colors hover:text-fg"
        >
          {showAll ? t("filters.showLess") : t("filters.more", { n: SECONDARY.length })}
        </button>
      )}
      {compact &&
        SECONDARY.map((category) => (
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
  );
}

/**
 * Map chrome. On desktop it stacks in the top-left corner and the timing lens
 * floats bottom-centre, within thumb reach of nothing and easy reach of the
 * cursor. On a phone the same controls collapse to one search field plus a
 * single scrolling row, because the map has to stay the hero.
 */
export function FilterBar({
  resultLabel,
  compactLabel,
}: {
  resultLabel: string;
  compactLabel: string;
}) {
  const { t } = useI18n();
  const search = useAppStore((s) => s.search);
  const setSearch = useAppStore((s) => s.setSearch);
  const lens = useAppStore((s) => s.lens);
  const setLens = useAppStore((s) => s.setLens);
  const lensOptions = useLensOptions();
  const categories = useAppStore((s) => s.categories);
  const [openOnMobile, setOpenOnMobile] = useState(false);

  return (
    <>
      {/* Desktop */}
      <div className="pointer-events-none absolute top-3 left-3 z-[400] hidden w-[352px] flex-col gap-2 md:flex">
        <div className="pointer-events-auto">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t("search.placeholder")}
            clearLabel={t("search.clear")}
          />
        </div>
        <div className="pointer-events-auto rounded-xl border border-line bg-surface p-2.5 shadow-e2">
          <CategoryChips />
          <p className="tnum mt-2.5 border-t border-line pt-2 text-[12px] text-fg-muted">
            {resultLabel}
          </p>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-4 left-1/2 z-[400] hidden -translate-x-1/2 md:block">
        <div className="pointer-events-auto">
          <Segmented
            value={lens}
            options={lensOptions}
            onChange={setLens}
            label={t("lens.label")}
          />
        </div>
      </div>

      {/* Mobile */}
      <div className="pointer-events-none absolute inset-x-2 top-2 z-[400] flex flex-col gap-2 md:hidden">
        <div className="pointer-events-auto flex gap-2">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t("search.placeholder")}
            clearLabel={t("search.clear")}
            className="flex-1"
          />
          <button
            type="button"
            onClick={() => setOpenOnMobile((v) => !v)}
            aria-expanded={openOnMobile}
            aria-label={t("filters.title")}
            className={cn(
              "relative grid h-10 w-10 shrink-0 place-items-center rounded-lg border shadow-e2 transition-colors",
              openOnMobile
                ? "border-accent bg-accent text-fg-on-accent"
                : "border-line bg-surface text-fg-muted",
            )}
          >
            {openOnMobile ? <X size={17} strokeWidth={2.2} /> : <SlidersHorizontal size={17} strokeWidth={2} />}
            {/* How many filters are hiding behind this button, stated on it. */}
            {!openOnMobile && categories.length > 0 && (
              <span className="tnum absolute -top-1.5 -right-1.5 grid h-4.5 min-w-4.5 place-items-center rounded-full border-2 border-surface bg-accent px-1 text-[10px] font-bold text-fg-on-accent">
                {categories.length}
              </span>
            )}
          </button>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <Segmented
            value={lens}
            options={lensOptions}
            onChange={setLens}
            label={t("lens.label")}
            size="sm"
            className="shadow-e2"
          />
          {/* rounded-md, not a pill: this reports a count, it does not filter,
              and the desktop card states the same datum as plain text. */}
          <span className="tnum truncate rounded-md border border-line bg-surface px-2 py-1 text-[11.5px] text-fg-muted shadow-e1">
            {compactLabel}
          </span>
        </div>

        {openOnMobile && (
          <div className="pointer-events-auto rounded-xl border border-line bg-surface p-2.5 shadow-e2">
            <div className="scroll-fade-x -mx-2.5 overflow-x-auto px-2.5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <CategoryChips compact />
            </div>
            <p className="tnum mt-2 border-t border-line pt-2 text-[12px] text-fg-muted">
              {resultLabel}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
