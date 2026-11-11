import { useI18n, type Lang } from "~/lib/i18n";
import { Segmented } from "~/components/ui/Segmented";

const OPTIONS: { value: Lang; label: string }[] = [
  { value: "ro", label: "ro" },
  { value: "en", label: "en" },
];

/**
 * Two languages, so a toggle rather than a menu — one tap, no disclosure. The
 * inactive language is still readable, because the person who needs it is by
 * definition not reading the active one. The choice is kept on the device, so
 * this is a radio group (base-ui rule 16): arrow keys may choose, and exactly
 * one language is always on.
 */
export function LangToggle() {
  const { lang, setLang, t } = useI18n();
  return <Segmented look="compact" value={lang} options={OPTIONS} onChange={setLang} label={t("lang.toggle")} />;
}
