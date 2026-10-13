import { useEffect } from "react";
import { Bell } from "./shell/Bell";
import { usePendingFavorite } from "~/hooks/useFavorites";
import { Link, useLocation, useNavigate } from "react-router";
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
import { browserPath, loginPath, registerPath } from "~/lib/authApi";
import { useLogout } from "../../vendor/ward/ward-auth-react.js";
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
 * This page, as the login page's `next`: signing in or registering from the
 * navbar comes back where it started, not to the map (brief 10's TP-05 walk).
 * A browser path, because a "Sign in with Ward" round trip returns to it too.
 * The auth pages themselves are not a place to come back to.
 */
function useReturnHere(): string | undefined {
  const { pathname, search } = useLocation();
  if (/^\/(login|register)\/?$/.test(pathname)) return undefined;
  return browserPath(pathname, search);
}

/**
 * The account menu: prm's own login, register and settings pages, and a
 * sign-out that ends prm's session (settings also offers ending the Ward
 * session a Ward sign-in began).
 */
function ProfileMenu() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const authed = status === "authenticated" && user;
  const fallback = (user?.username ?? "?").charAt(0).toUpperCase();
  const here = useReturnHere();
  const { logout } = useLogout();

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
          <DropdownMenuItem render={<Link to="/settings" />}>{t("nav.settings")}</DropdownMenuItem>
          <DropdownMenuItem
            onClick={async () => {
              if (await logout()) navigate("/");
            }}
          >
            {t("nav.signOut")}
          </DropdownMenuItem>
        </>
      ) : (
        <>
          <DropdownMenuLabel>{t("nav.account")}</DropdownMenuLabel>
          <DropdownMenuItem render={<Link to={loginPath(here)} />}>{t("nav.login")}</DropdownMenuItem>
          <DropdownMenuItem render={<Link to={registerPath(here)} />}>{t("nav.register")}</DropdownMenuItem>
        </>
      )}
    </DropdownMenu>
  );
}

/**
 * The phone tab bar's account entry. It points at settings when signed in and
 * at login otherwise, so the tab always does the thing the person expects
 * from it.
 */
function AccountTab() {
  const { t } = useI18n();
  const status = useAuthStore((s) => s.status);
  const here = useReturnHere();
  const to = status === "authenticated" ? "/settings" : loginPath(here);

  return (
    <Link
      to={to}
      className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] text-fg-muted"
    >
      <User className="h-5 w-5" aria-hidden />
      {t("nav.account")}
    </Link>
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

  // A favourite asked for while signed out, finished on the way back.
  usePendingFavorite();

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
            <TopLink to="/archive">{t("nav.archive")}</TopLink>
            <TopLink to="/about-data">{t("nav.aboutData")}</TopLink>
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <LangToggle />
          <ThemeToggle />
          <Bell />
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
