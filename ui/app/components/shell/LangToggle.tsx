import { useI18n, type Lang } from "~/lib/i18n";
import { cn } from "~/lib/utils";

/**
 * Two languages, so a toggle rather than a menu — one tap, no disclosure. The
 * inactive language is still readable, because the person who needs it is by
 * definition not reading the active one.
 */
export function LangToggle() {
  const { lang, setLang, t } = useI18n();
  const options: Lang[] = ["ro", "en"];

  return (
    <div
      role="group"
      aria-label={t("lang.toggle")}
      className="inline-flex h-8 items-center rounded-lg border border-line bg-surface p-0.5"
    >
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setLang(option)}
          aria-pressed={lang === option}
          className={cn(
            "h-7 rounded-md px-2 text-[11.5px] font-semibold tracking-[0.04em] uppercase",
            "transition-colors duration-[120ms]",
            lang === option
              ? "bg-accent text-fg-on-accent"
              : "text-fg-faint hover:bg-surface-2 hover:text-fg",
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
