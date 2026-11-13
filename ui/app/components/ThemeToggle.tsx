import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useI18n } from "~/lib/i18n";
import { isTheme } from "~/lib/theme";
import { DropdownMenu, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem } from "./ui/DropdownMenu";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();

  const options = [
    { value: "light", label: t("theme.light"), icon: Sun },
    { value: "dark", label: t("theme.dark"), icon: Moon },
    { value: "system", label: t("theme.system"), icon: Monitor },
  ] as const;

  const Current = options.find((o) => o.value === theme)?.icon ?? Monitor;

  return (
    <DropdownMenu
      trigger={
        <button
          type="button"
          aria-label={t("theme.toggle")}
          className="grid h-11 w-11 place-items-center rounded-lg text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg md:h-9 md:w-9"
        >
          <Current size={16} strokeWidth={2} />
        </button>
      }
    >
      <DropdownMenuLabel>{t("theme.toggle")}</DropdownMenuLabel>
      <DropdownMenuRadioGroup value={theme} onValueChange={(value) => isTheme(value) && setTheme(value)}>
        {options.map(({ value, label, icon: Icon }) => (
          <DropdownMenuRadioItem key={value} value={value}>
            <Icon size={14} strokeWidth={2} className="text-fg-faint group-data-checked:text-accent" />
            {label}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </DropdownMenu>
  );
}
