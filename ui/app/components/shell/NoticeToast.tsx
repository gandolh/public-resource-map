import { useEffect } from "react";
import { useI18n } from "~/lib/i18n";
import { useAppStore } from "~/stores/appStore";

const VISIBLE_MS = 5000;

/**
 * The shell's one-off messages, such as a drawn area cleared by a city change
 * (brief 15): a filter must never vanish without a word. Shown for a few
 * seconds, announced politely, and tappable away.
 */
export function NoticeToast() {
  const { t } = useI18n();
  const notice = useAppStore((s) => s.notice);
  const dismiss = useAppStore((s) => s.dismissNotice);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(dismiss, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [notice, dismiss]);

  return (
    <div role="status" className="pointer-events-none absolute inset-x-0 bottom-20 z-[600] flex justify-center px-4 md:bottom-16">
      {notice && (
        <button
          type="button"
          onClick={dismiss}
          className="pointer-events-auto rounded-lg border border-line bg-surface px-3.5 py-2 text-[13px] text-fg shadow-e3"
        >
          {t("area.cleared")}
        </button>
      )}
    </div>
  );
}
