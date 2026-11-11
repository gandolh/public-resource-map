import { useEffect } from "react";
import { notify } from "~/components/ui/toast";
import { useI18n } from "~/lib/i18n";
import { useAppStore } from "~/stores/appStore";

/**
 * The shell's one-off messages, such as a drawn area cleared by a city change
 * (draw-to-filter): a filter must never vanish without a word. The store holds
 * the notice until this hands it to the toast host, which shows it for a few
 * seconds and announces it politely.
 */
export function NoticeToast() {
  const { t } = useI18n();
  const notice = useAppStore((s) => s.notice);
  const dismiss = useAppStore((s) => s.dismissNotice);

  useEffect(() => {
    if (!notice) return;
    notify({ title: t("area.cleared") });
    dismiss();
  }, [notice, dismiss, t]);

  return null;
}
