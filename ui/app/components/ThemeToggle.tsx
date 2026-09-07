import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useI18n } from "~/lib/i18n";
import { DropdownMenu, DropdownMenuItem, DropdownMenuLabel } from "./ui/DropdownMenu";

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
          className="grid h-8 w-8 place-items-center rounded-lg text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
        >
          <Current size={16} strokeWidth={2} />
        </button>
      }
    >
      <DropdownMenuLabel>{t("theme.toggle")}</DropdownMenuLabel>
      {options.map(({ value, label, icon: Icon }) => (
        <DropdownMenuItem key={value} onClick={() => setTheme(value)}>
          <Icon size={14} strokeWidth={2} className={value === theme ? "text-accent" : "text-fg-faint"} />
          {label}
        </DropdownMenuItem>
      ))}
    </DropdownMenu>
  );
}
