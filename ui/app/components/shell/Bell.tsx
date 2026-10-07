import { Link } from "react-router";
import { Popover } from "@base-ui/react/popover";
import { Bell as BellIcon } from "lucide-react";
import type { NotificationDto } from "@public-resource-map/shared";
import { useInbox, useMarkAllRead } from "~/hooks/useFavorites";
import { useAuthStore } from "~/stores/authStore";
import { useI18n } from "~/lib/i18n";
import { cn } from "~/lib/utils";

/**
 * The inbox (brief 05): new events at places you follow, one item per place
 * and batch, and day-before reminders. Opening it marks everything read.
 */
export function Bell() {
  const { t } = useI18n();
  const signedIn = useAuthStore((s) => s.status === "authenticated" && s.user !== null);
  const { data } = useInbox();
  const markAll = useMarkAllRead();
  if (!signedIn) return null;
  const unread = data?.unread ?? 0;

  return (
    <Popover.Root
      onOpenChange={(open) => {
        if (open && unread > 0) markAll.mutate();
      }}
    >
      <Popover.Trigger
        aria-label={unread > 0 ? t("bell.labelUnread", { n: unread }) : t("bell.label")}
        className="relative grid h-9 w-9 place-items-center rounded-lg text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
      >
        <BellIcon size={18} strokeWidth={2} />
        {unread > 0 && (
          <span className="tnum absolute -top-0.5 -right-0.5 grid h-4.5 min-w-4.5 place-items-center rounded-full border-2 border-surface bg-accent px-1 text-[10px] font-bold text-fg-on-accent">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={6} align="end" className="z-[1000]">
          <Popover.Popup className="w-[320px] overflow-hidden rounded-xl border border-line bg-surface shadow-e3 outline-none">
            <Popover.Title className="border-b border-line px-3.5 py-2.5 text-[13px] font-semibold">
              {t("bell.label")}
            </Popover.Title>
            {!data?.data.length ? (
              <p className="px-3.5 py-6 text-center text-[13px] text-fg-muted">{t("bell.empty")}</p>
            ) : (
              <ul className="max-h-[360px] overflow-y-auto">
                {data.data.map((item) => (
                  <Item key={item.id} item={item} />
                ))}
              </ul>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

function Item({ item }: { item: NotificationDto }) {
  const { t, tn, dayMonth, time } = useI18n();
  const place = item.place?.name ?? "";
  const headline =
    item.kind === "reminder"
      ? t("bell.reminder", { title: item.events[0]?.title ?? "", place })
      : tn("bell.newEvents", item.events.length, { place });
  const content = (
    <>
      <span className="block text-[13px] leading-snug font-medium text-fg">{headline}</span>
      {item.kind === "new-event" && (
        <span className="mt-0.5 block truncate text-[12px] text-fg-muted">
          {item.events.map((e) => e.title).join(" · ")}
        </span>
      )}
      {item.kind === "reminder" && item.events[0] && (
        <span className="tnum mt-0.5 block text-[12px] text-fg-muted">
          {dayMonth(item.events[0].startDate)} · {time(item.events[0].startDate)}
        </span>
      )}
    </>
  );
  return (
    <li className={cn("border-b border-line last:border-b-0", !item.readAt && "bg-accent-weak/50")}>
      {item.place?.listed ? (
        <Link to={`/places/${item.place.id}`} className="block px-3.5 py-2.5 hover:bg-surface-2">
          {content}
        </Link>
      ) : (
        // No place, or one OSM no longer has (brief 34): named, not a broken link.
        <div className="px-3.5 py-2.5">
          {content}
          {item.place && (
            <span className="mt-0.5 block text-[12px] text-fg-faint">{t("place.unlisted")}</span>
          )}
        </div>
      )}
    </li>
  );
}
