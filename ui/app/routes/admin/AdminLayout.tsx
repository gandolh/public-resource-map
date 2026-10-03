import { useEffect } from "react";
import { NavLink, Outlet, type MetaFunction } from "react-router";
import { ArrowLeft, Inbox, Loader2, Radio, ShieldAlert } from "lucide-react";
import { AppProviders } from "~/components/Layout";
import { BrandMark } from "~/components/shell/BrandMark";
import { StateBlock } from "~/components/ui/StateBlock";
import { useAuthStore } from "~/stores/authStore";
import { useI18n } from "~/lib/i18n";
import { wardLoginUrl } from "~/lib/authApi";
import { cn } from "~/lib/utils";

export const meta: MetaFunction = () => [{ title: "Admin — CivicMap" }];

/**
 * The admin shell (brief 16): its own layout and sidebar, not the public
 * Navbar, because it is a different audience doing a different job. Its route
 * modules are split from the public bundle by React Router, so a visitor never
 * downloads them. The server is the real gate (every admin route is 401/403
 * without `prm:admin`); this one only decides what to show.
 */
export default function AdminLayout() {
  return (
    <AppProviders>
      <AdminShell />
    </AppProviders>
  );
}

function AdminShell() {
  const { t } = useI18n();
  const status = useAuthStore((s) => s.status);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const user = useAuthStore((s) => s.user);
  const bootstrap = useAuthStore((s) => s.bootstrap);

  useEffect(() => {
    if (status === "idle") void bootstrap();
  }, [status, bootstrap]);

  if (status === "idle" || status === "loading") {
    return (
      <div className="grid h-[100dvh] place-items-center bg-bg text-fg-muted">
        <Loader2 size={20} className="animate-spin" aria-label={t("state.loading")} />
      </div>
    );
  }

  if (!isAdmin) {
    const signedOut = status === "unauthenticated";
    return (
      <div className="grid h-[100dvh] place-items-center bg-bg px-4 text-fg">
        <div className="w-full max-w-[420px] rounded-xl border border-line bg-surface shadow-e2">
          <StateBlock
            tone="danger"
            icon={<ShieldAlert size={18} strokeWidth={2} />}
            title={signedOut ? t("admin.signInTitle") : t("admin.forbiddenTitle")}
            body={
              status === "unavailable"
                ? t("auth.unavailable")
                : signedOut
                  ? t("admin.signInBody")
                  : t("admin.forbiddenBody")
            }
            action={
              <div className="flex flex-wrap justify-center gap-2">
                {signedOut && (
                  <a
                    href={wardLoginUrl(`${import.meta.env.BASE_URL}admin`)}
                    className="inline-flex h-9 items-center rounded-lg bg-accent px-3.5 text-[13.5px] font-medium text-fg-on-accent"
                  >
                    {t("nav.login")}
                  </a>
                )}
                <a
                  href={import.meta.env.BASE_URL}
                  className="inline-flex h-9 items-center rounded-lg border border-line bg-surface px-3.5 text-[13.5px] font-medium"
                >
                  {t("admin.exit")}
                </a>
              </div>
            }
          />
        </div>
      </div>
    );
  }

  const link = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors",
      isActive ? "bg-surface-2 text-fg" : "text-fg-muted hover:bg-surface-2 hover:text-fg",
    );

  return (
    <div className="flex h-[100dvh] bg-bg text-fg">
      <aside className="flex w-[220px] shrink-0 flex-col border-r border-line bg-surface p-3">
        <div className="flex items-center gap-2 px-2 pt-1 pb-4 text-[15px] font-semibold tracking-[-0.02em]">
          <BrandMark />
          <span>{t("admin.title")}</span>
        </div>
        <nav aria-label={t("admin.title")} className="flex flex-col gap-0.5">
          <NavLink to="/admin" end className={link}>
            <Inbox size={16} strokeWidth={2} />
            {t("admin.review")}
          </NavLink>
          <NavLink to="/admin/sources" className={link}>
            <Radio size={16} strokeWidth={2} />
            {t("admin.sources")}
          </NavLink>
        </nav>
        <div className="mt-auto space-y-2 border-t border-line pt-3">
          <p className="truncate px-2 text-[12px] text-fg-muted" title={user?.username}>
            {t("admin.signedInAs", { name: user?.username ?? "" })}
          </p>
          <a href={import.meta.env.BASE_URL} className={link({ isActive: false })}>
            <ArrowLeft size={16} strokeWidth={2} />
            {t("admin.exit")}
          </a>
        </div>
      </aside>
      <main className="min-w-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
