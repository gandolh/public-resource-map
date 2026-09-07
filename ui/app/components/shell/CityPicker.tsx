import { Check, ChevronDown } from "lucide-react";
import { useI18n } from "~/lib/i18n";
import { CITIES } from "~/lib/cities";
import { useAppStore } from "~/stores/appStore";
import { DropdownMenu, DropdownMenuItem, DropdownMenuLabel } from "~/components/ui/DropdownMenu";

/**
 * The city is the primary lens — a control in the bar, not a filter buried in a
 * panel. Everything downstream (pins, what's-on, counts) is scoped by it.
 */
export function CityPicker() {
  const { t } = useI18n();
  const city = useAppStore((s) => s.city);
  const setCity = useAppStore((s) => s.setCity);

  return (
    <DropdownMenu
      align="start"
      trigger={
        <button
          type="button"
          aria-label={t("city.change")}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 text-[13.5px] font-medium text-fg transition-colors hover:bg-surface-2 hover:border-line-strong"
        >
          {city.name}
          <ChevronDown size={14} strokeWidth={2.2} className="text-fg-faint" />
        </button>
      }
    >
      <DropdownMenuLabel>{t("city.label")}</DropdownMenuLabel>
      {CITIES.map((option) => (
        <DropdownMenuItem key={option.id} onClick={() => setCity(option)}>
          <Check
            size={14}
            strokeWidth={2.5}
            className={option.id === city.id ? "text-accent" : "opacity-0"}
          />
          {option.name}
        </DropdownMenuItem>
      ))}
    </DropdownMenu>
  );
}
