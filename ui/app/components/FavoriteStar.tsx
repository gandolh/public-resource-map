import { Popover } from "@base-ui/react/popover";
import { useLocation } from "react-router";
import { Bell, BellRing, Star } from "lucide-react";
import { useFavorites, useToggleFavorite, PENDING_FAVORITE } from "~/hooks/useFavorites";
import { useAuthStore } from "~/stores/authStore";
import { useI18n } from "~/lib/i18n";
import { wardLoginUrl, wardRegisterUrl } from "~/lib/authApi";
import type { FavoriteKind } from "~/lib/meApi";
import { cn } from "~/lib/utils";

/**
 * Follow a place, or ask to be reminded of an event (brief 05). Signed out,
 * the star explains itself and offers Ward's sign-in, carrying the favourite
 * along so it is completed on the way back.
 */
export function FavoriteStar({
  kind,
  id,
  name,
  size = "md",
}: {
  kind: FavoriteKind;
  id: string;
  name: string;
  size?: "sm" | "md";
}) {
  const { t } = useI18n();
  const location = useLocation();
  const signedIn = useAuthStore((s) => s.status === "authenticated" && s.user !== null);
  const { data } = useFavorites();
  const toggle = useToggleFavorite();

  const on = Boolean(data && (kind === "place" ? data.places : data.events).includes(id));
  const Icon = kind === "place" ? Star : on ? BellRing : Bell;
  const label = t(`fav.${kind}.${on ? "remove" : "add"}`, { name });
  const box =
    size === "sm"
      ? "h-8 w-8 rounded-md"
      : "h-10 w-10 rounded-lg border border-line bg-surface hover:border-line-strong hover:bg-surface-2";
  const iconSize = size === "sm" ? 15 : 17;
  const look = cn(
    "grid shrink-0 place-items-center transition-colors",
    box,
    on ? "text-accent" : "text-fg-muted hover:text-fg",
  );

  if (signedIn) {
    return (
      <button
        type="button"
        aria-pressed={on}
        aria-label={label}
        title={label}
        disabled={toggle.isPending}
        onClick={() => toggle.mutate({ kind, id, on: !on })}
        className={look}
      >
        <Icon size={iconSize} strokeWidth={2.2} fill={on && kind === "place" ? "currentColor" : "none"} />
      </button>
    );
  }

  // Back to this very page, with the favourite to finish.
  const params = new URLSearchParams(location.search);
  params.set(PENDING_FAVORITE, `${kind}:${id}`);
  const next = `${import.meta.env.BASE_URL.replace(/\/$/, "")}${location.pathname}?${params}`;

  return (
    <Popover.Root>
      <Popover.Trigger aria-label={label} title={label} className={look}>
        <Icon size={iconSize} strokeWidth={2.2} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={6} align="end" className="z-[1000]">
          <Popover.Popup className="w-[260px] rounded-xl border border-line bg-surface p-3.5 text-[13px] shadow-e3 outline-none">
            <Popover.Title className="font-semibold text-fg">{t(`fav.${kind}.why`)}</Popover.Title>
            <Popover.Description className="mt-1 text-fg-muted">{t("fav.signInBody")}</Popover.Description>
            <div className="mt-3 flex gap-2">
              <a
                href={wardLoginUrl(next)}
                className="inline-flex h-8 items-center rounded-md bg-accent px-3 font-medium text-fg-on-accent"
              >
                {t("nav.login")}
              </a>
              <a
                href={wardRegisterUrl(next)}
                className="inline-flex h-8 items-center rounded-md border border-line px-3 font-medium text-fg"
              >
                {t("nav.register")}
              </a>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
