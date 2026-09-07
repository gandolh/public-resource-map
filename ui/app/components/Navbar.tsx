import { useEffect } from "react";
import { Link, useLocation } from "react-router";
import { CalendarDays, Map as MapIcon, User } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { BrandMark } from "./shell/BrandMark";
import { CityPicker } from "./shell/CityPicker";
import { LangToggle } from "./shell/LangToggle";
import { Avatar } from "./ui/Avatar";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "./ui/DropdownMenu";
import { useAuthStore } from "~/stores/authStore";
import { wardAccountUrl, wardLoginUrl, wardRegisterUrl } from "~/lib/authApi";
import { useAppStore } from "~/stores/appStore";
import { useI18n } from "~/lib/i18n";
import { cn } from "~/lib/utils";

function TopLink({ to, children }: { to: string; children: React.ReactNode }) {
  const { pathname } = useLocation();
  const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
  return (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-md px-2.5 py-1.5 text-[13.5px] font-medium transition-colors duration-[120ms]",
        active ? "bg-surface-2 text-fg" : "text-fg-muted hover:bg-surface-2 hover:text-fg",
      )}
    >
      {children}
    </Link>
  );
}

/**
 * The account menu.
 *
 * Every item here is an `<a href>` to Ward, not a `<Link>` to a prm route.
 * That is the visible shape of the cutover: prm has no login page, no
 * registration page and no logout of its own, so these are **navigations off
 * this app** and must be full page loads. A client-side `<Link>` would try to
 * resolve `/ward/login` inside prm's router and 404.
 */
function ProfileMenu() {
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const authed = status === "authenticated" && user;
  const fallback = (user?.username ?? "?").charAt(0).toUpperCase();

  return (
    <DropdownMenu
      trigger={
        <button
          type="button"
          aria-label={t("nav.account")}
          className="grid h-8 w-8 place-items-center rounded-lg transition-colors hover:bg-surface-2"
        >
          <Avatar fallback={authed ? fallback : undefined} />
        </button>
      }
    >
      {authed ? (
        <>
          <DropdownMenuLabel>{t("nav.account")}</DropdownMenuLabel>
          <div className="truncate px-2.5 pb-2 text-[13px] text-fg">{user.username}</div>
          <DropdownMenuSeparator />
          {/* Signing out is Ward's. prm must not fake one: the session belongs
              to the estate, so ending it here while the other apps still
              honoured it would be a lie the cookie contradicts immediately. */}
          <DropdownMenuItem render={<a href={wardAccountUrl()} />}>
            {t("nav.logout")}
          </DropdownMenuItem>
        </>
      ) : status === "unavailable" ? (
        <>
          <DropdownMenuLabel>{t("nav.account")}</DropdownMenuLabel>
          {/* Not "sign in": the way in is the service that is not answering,
              so offering the button would send them into a dead end. */}
          <div className="px-2.5 pb-2 text-[13px] text-fg-muted">{t("auth.unavailable")}</div>
        </>
      ) : (
        <>
          <DropdownMenuLabel>{t("nav.account")}</DropdownMenuLabel>
          <DropdownMenuItem render={<a href={wardLoginUrl()} />}>{t("nav.login")}</DropdownMenuItem>
          <DropdownMenuItem render={<a href={wardRegisterUrl()} />}>
            {t("nav.register")}
          </DropdownMenuItem>
        </>
      )}
    </DropdownMenu>
  );
}

/**
 * The phone tab bar's account entry.
 *
 * A plain `<a>` rather than a `BottomTab`, because its destination is Ward and
 * leaves this app — a router `<Link>` would 404 inside prm. It points at the
 * account page when signed in and at login otherwise, so the tab always does
 * the thing the person expects from it.
 */
function AccountTab() {
  const { t } = useI18n();
  const status = useAuthStore((s) => s.status);
  const href = status === "authenticated" ? wardAccountUrl() : wardLoginUrl();

  return (
    <a
      href={href}
      className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] text-fg-muted"
    >
      <User className="h-5 w-5" aria-hidden />
      {t("nav.account")}
    </a>
  );
}

function BottomTab({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: React.ElementType;
  label: string;
}) {
  const { pathname } = useLocation();
  const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
  return (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-1 flex-col items-center gap-1 px-1 py-2 transition-colors",
        active ? "text-accent" : "text-fg-muted",
      )}
    >
      <Icon size={19} strokeWidth={active ? 2.4 : 2} />
      <span className="max-w-full truncate text-[10.5px] leading-none font-medium">
        {label}
      </span>
    </Link>
  );
}

export function Navbar() {
  const { t } = useI18n();
  const status = useAuthStore((s) => s.status);
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const hydrateCity = useAppStore((s) => s.hydrateCity);
  const selectedId = useAppStore((s) => s.selectedId);

  useEffect(() => {
    if (status === "idle") void bootstrap();
  }, [status, bootstrap]);

  useEffect(() => {
    hydrateCity();
  }, [hydrateCity]);

  return (
    <>
      <header className="relative z-[700] flex h-13 shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-3 md:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-md pr-1 text-[15px] font-semibold tracking-[-0.02em]"
          >
            <BrandMark />
            <span className="hidden sm:inline">{t("brand")}</span>
          </Link>
          <span aria-hidden="true" className="hidden h-4 w-px bg-line sm:block" />
          <CityPicker />
          <nav className="ml-1 hidden items-center gap-0.5 md:flex">
            <TopLink to="/">{t("nav.map")}</TopLink>
            <TopLink to="/whats-on">{t("nav.whatsOn")}</TopLink>
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <LangToggle />
          <ThemeToggle />
          <ProfileMenu />
        </div>
      </header>

      {/* The map is the hero on a phone, so the tab bar gets out of the way the
          moment a place sheet is open. */}
      <nav
        className={cn(
          "fixed inset-x-0 bottom-0 z-[500] flex border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden",
          selectedId && "hidden",
        )}
      >
        <BottomTab to="/" icon={MapIcon} label={t("nav.map")} />
        <BottomTab to="/whats-on" icon={CalendarDays} label={t("nav.whatsOn")} />
        <AccountTab />
      </nav>
    </>
  );
}
