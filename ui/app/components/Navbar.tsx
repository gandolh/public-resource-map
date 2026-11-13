import { useEffect } from "react";
import { Bell } from "./shell/Bell";
import { usePendingFavorite } from "~/hooks/useFavorites";
import { Link, useLocation, useNavigate } from "react-router";
import { Archive, CalendarDays, Info, Map as MapIcon, User } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { BrandMark } from "./shell/BrandMark";
import { CityPicker } from "./shell/CityPicker";
import { LangToggle } from "./shell/LangToggle";
import { Avatar } from "./ui/Avatar";
import { DropdownMenu, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "./ui/DropdownMenu";
import { useAuthStore } from "~/stores/authStore";
import { browserPath, loginPath, registerPath } from "~/lib/authApi";
import { useLogout } from "../../vendor/ward/ward-auth-react.js";
import { useAppStore } from "~/stores/appStore";
import { useI18n } from "~/lib/i18n";
import { cn } from "~/lib/utils";

function TopLink({ to, children }: { to: string; children: React.ReactNode }) {
  const { pathname } = useLocation();
  const active = to === "/" ? pathname === "/" || pathname.startsWith("/places/") : pathname.startsWith(to);
  return (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex h-13 items-center px-3 text-body font-medium transition-colors duration-(--dur-1)",
        "after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:rounded-xs after:bg-accent after:content-['']",
        active ? "text-fg" : "text-fg-muted after:hidden hover:text-fg",
      )}
    >
      {children}
    </Link>
  );
}

/**
 * This page, as the login page's `next`: signing in or registering from the
 * navbar comes back where it started, not to the map (the TP-05 walk).
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
          className="grid h-11 w-11 place-items-center rounded-lg border border-line bg-surface-2 text-fg-muted transition-colors hover:bg-surface-3 hover:text-fg md:h-9 md:w-9"
        >
          {authed ? (
            <Avatar fallback={fallback} className="border-0 bg-transparent" />
          ) : (
            <User size={17} strokeWidth={2} />
          )}
        </button>
      }
    >
      {authed ? (
        <>
          <DropdownMenuLabel>{t("nav.account")}</DropdownMenuLabel>
          <div className="truncate px-2.5 pb-2 text-ui text-fg">{user.username}</div>
          <DropdownMenuSeparator />
          <DropdownMenuItem render={<Link to="/settings" />}>{t("nav.settings")}</DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              void logout().then((ok) => {
                if (ok) void navigate("/");
              });
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

function BottomTab({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) {
  const { pathname } = useLocation();
  const active = to === "/" ? pathname === "/" || pathname.startsWith("/places/") : pathname.startsWith(to);
  return (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-meta transition-colors",
        active ? "font-semibold text-accent" : "font-medium text-fg-muted hover:text-fg",
      )}
    >
      <Icon size={20} strokeWidth={active ? 2.3 : 2} aria-hidden="true" />
      <span className="max-w-full truncate px-1">{label}</span>
    </Link>
  );
}

/**
 * The phone's navigation: four labelled tabs, under the sheet and never hidden
 * by it. In the page's flow, so the page above it ends where it begins.
 */
export function TabBar() {
  const { t } = useI18n();
  return (
    <nav
      aria-label={t("nav.menu")}
      className="z-nav flex h-(--tabbar) shrink-0 border-t border-line-strong bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <BottomTab to="/" icon={MapIcon} label={t("nav.map")} />
      <BottomTab to="/whats-on" icon={CalendarDays} label={t("nav.whatsOn")} />
      <BottomTab to="/archive" icon={Archive} label={t("nav.archive")} />
      <BottomTab to="/about-data" icon={Info} label={t("nav.aboutData")} />
    </nav>
  );
}

export function Navbar() {
  const { t } = useI18n();
  const status = useAuthStore((s) => s.status);
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const authed = status === "authenticated";
  const hydrateCity = useAppStore((s) => s.hydrateCity);

  useEffect(() => {
    if (status === "idle") void bootstrap();
  }, [status, bootstrap]);

  useEffect(() => {
    hydrateCity();
  }, [hydrateCity]);

  // A favourite asked for while signed out, finished on the way back.
  usePendingFavorite();

  return (
    <header className="relative z-nav flex h-13 shrink-0 items-center gap-1.5 border-b border-line bg-surface px-2 min-[380px]:gap-2 md:px-4">
      <Link
        to="/"
        className={cn(
          "flex h-11 shrink-0 items-center justify-center gap-2 rounded-md text-field font-semibold tracking-[-0.01em] max-[339px]:hidden md:mr-2 md:h-auto",
          // Signed in, the bell takes the mark's place on a phone; the Map tab leads home.
          authed && "max-[419px]:hidden",
        )}
      >
        <BrandMark size={28} />
        <span className="hidden md:inline">{t("brand")}</span>
      </Link>
      <CityPicker />
      <nav className="ml-2 hidden md:flex">
        <TopLink to="/">{t("nav.map")}</TopLink>
        <TopLink to="/whats-on">{t("nav.whatsOn")}</TopLink>
        <TopLink to="/archive">{t("nav.archive")}</TopLink>
        <TopLink to="/about-data">{t("nav.aboutData")}</TopLink>
      </nav>

      <div className="ml-auto flex shrink-0 items-center gap-1.5 md:gap-2">
        <LangToggle />
        <ThemeToggle />
        <Bell />
        <ProfileMenu />
      </div>
    </header>
  );
}
