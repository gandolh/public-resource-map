import type { FormEvent, ReactNode } from "react";
import { Link, useNavigate, type MetaFunction } from "react-router";
import { Loader2, UserRound } from "lucide-react";
import {
  useChangePassword,
  useLogout,
  useSession,
  useSetLocalPassword,
  useWardLink,
  useWardSignOut,
  useWardUnlink,
} from "../../vendor/ward/ward-auth-react.js";
import { AuthErrorNotice, Field, Notice } from "~/components/auth/fields";
import { Button } from "~/components/ui/Button";
import { StateBlock } from "~/components/ui/StateBlock";
import { browserPath, loginPath } from "~/lib/authApi";
import { useI18n } from "~/lib/i18n";

export const meta: MetaFunction = () => [{ title: "Setări cont — CivicMap" }];

const MIN_PASSWORD = 8;

function Section({ title, lead, children }: { title: string; lead?: string; children?: ReactNode }) {
  return (
    <section className="mt-8 border-t border-line pt-6 first:mt-6 first:border-t-0 first:pt-0">
      <h2 className="text-[17px] leading-snug font-semibold tracking-[-0.015em] text-fg">{title}</h2>
      {lead && <p className="mt-1.5 text-[14px] leading-relaxed text-fg-muted">{lead}</p>}
      {children && <div className="mt-4 space-y-3">{children}</div>}
    </section>
  );
}

/**
 * Account settings (brief 24 of Ward's corpus): the password, the Ward link,
 * what mail this account can get, and signing out. A user created by a Ward
 * sign-in sets a first local password here, so they can still get in while
 * Ward is down; linking and unlinking Ward happen here and only here, never by
 * matching names.
 */
export default function SettingsRoute() {
  const { t } = useI18n();
  const session = useSession();

  if (session.status === "loading") {
    return (
      <div className="grid h-full place-items-center text-fg-muted">
        <Loader2 size={20} className="animate-spin" aria-label={t("state.loading")} />
      </div>
    );
  }

  if (session.status !== "signed_in") {
    return (
      <div className="grid h-full place-items-center px-4">
        <StateBlock
          icon={<UserRound size={18} strokeWidth={2} />}
          title={t("settings.signInTitle")}
          body={t("settings.signInBody")}
          action={
            <Link
              to={loginPath(browserPath("/settings"))}
              className="inline-flex h-9 items-center rounded-lg bg-accent px-3.5 text-[13.5px] font-medium text-fg-on-accent"
            >
              {t("nav.login")}
            </Link>
          }
        />
      </div>
    );
  }

  const { user, ward } = session;
  return (
    <div className="h-full overflow-y-auto pb-20 md:pb-8">
      <article className="mx-auto w-full max-w-[560px] px-4 py-6 md:px-6 md:py-10">
        <h1 className="text-[26px] leading-[1.15] font-semibold tracking-[-0.025em] md:text-[30px]">
          {t("settings.title")}
        </h1>
        <p className="mt-2 text-[14.5px] text-fg-muted">{t("settings.signedInAs", { name: user.username })}</p>

        {user.hasPassword ? <ChangePassword /> : <FirstPassword wardEnabled={ward.enabled} />}
        <WardLink enabled={ward.enabled} linked={ward.linked} hasPassword={user.hasPassword} />
        <Section title={t("settings.mailTitle")} lead={t(ward.linked ? "settings.mailLinked" : "settings.mailLocalOnly")} />
        <SignOut fromWard={session.session.origin === "ward"} />
      </article>
    </div>
  );
}

function ChangePassword() {
  const { t } = useI18n();
  const { changePassword, pending, error, done } = useChangePassword();

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const ok = await changePassword(String(form.get("current") ?? ""), String(form.get("next") ?? ""));
    if (ok) formEl.reset();
  };

  return (
    <Section title={t("settings.passwordTitle")} lead={t("settings.passwordLead")}>
      <form onSubmit={submit} className="space-y-4">
        <Field label={t("settings.currentPassword")} name="current" type="password" autoComplete="current-password" required />
        <Field
          label={t("settings.newPassword")}
          name="next"
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD}
          hint={t("auth.passwordHint", { n: MIN_PASSWORD })}
          required
        />
        <AuthErrorNotice error={error} />
        {done && <Notice tone="ok">{t("settings.passwordChanged")}</Notice>}
        <Button type="submit" variant="primary" disabled={pending}>
          {t("settings.changePassword")}
        </Button>
      </form>
    </Section>
  );
}

/** A user created by a Ward sign-in has no local password until they set one here. */
function FirstPassword({ wardEnabled }: { wardEnabled: boolean }) {
  const { t } = useI18n();
  const local = useSetLocalPassword();
  const needsWard = local.error?.code === "reauthentication_required";

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void local.setPassword(String(new FormData(e.currentTarget).get("next") ?? ""));
  };

  return (
    <Section title={t("settings.passwordTitle")} lead={t("settings.noPasswordLead")}>
      {local.reauthenticated && !local.done && <Notice tone="ok">{t("settings.reauthenticated")}</Notice>}
      <form onSubmit={submit} className="space-y-4">
        <Field
          label={t("settings.newPassword")}
          name="next"
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD}
          hint={t("auth.passwordHint", { n: MIN_PASSWORD })}
          required
        />
        <AuthErrorNotice error={local.error} />
        {local.done && <Notice tone="ok">{t("settings.passwordSet")}</Notice>}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="primary" disabled={local.pending || !wardEnabled}>
            {t("settings.setPassword")}
          </Button>
          {needsWard && (
            <Button variant="secondary" disabled={local.pending} onClick={() => void local.reauthenticate()}>
              {t("settings.reauthenticate")}
            </Button>
          )}
        </div>
      </form>
    </Section>
  );
}

function WardLink({ enabled, linked, hasPassword }: { enabled: boolean; linked: boolean; hasPassword: boolean }) {
  const { t } = useI18n();
  const link = useWardLink();
  const unlink = useWardUnlink();

  if (!enabled) return <Section title={t("settings.wardTitle")} lead={t("settings.wardOff")} />;

  return (
    <Section title={t("settings.wardTitle")} lead={t(linked ? "settings.wardLinkedLead" : "settings.wardUnlinkedLead")}>
      {link.linked && <Notice tone="ok">{t("settings.linked")}</Notice>}
      {unlink.done && <Notice tone="ok">{t("settings.unlinked")}</Notice>}
      <AuthErrorNotice error={link.error ?? unlink.error} />
      {linked ? (
        <>
          {!hasPassword && <Notice tone="neutral">{t("settings.unlinkNeedsPassword")}</Notice>}
          <Button variant="secondary" disabled={unlink.pending || !hasPassword} onClick={() => void unlink.unlink()}>
            {t("settings.unlink")}
          </Button>
        </>
      ) : (
        <Button variant="secondary" disabled={link.pending} onClick={() => void link.link()}>
          {t("settings.link")}
        </Button>
      )}
    </Section>
  );
}

function SignOut({ fromWard }: { fromWard: boolean }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const out = useLogout();
  const outOfWard = useWardSignOut();

  return (
    <Section title={t("settings.signOutTitle")}>
      <AuthErrorNotice error={out.error ?? outOfWard.error} />
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          disabled={out.pending}
          onClick={async () => {
            if (await out.logout()) navigate("/");
          }}
        >
          {t("settings.signOut")}
        </Button>
        {/* Only a session that began with Ward has a Ward session to end. */}
        {fromWard && (
          <Button variant="ghost" disabled={outOfWard.pending} onClick={() => void outOfWard.signOut()}>
            {t("settings.signOutWard")}
          </Button>
        )}
      </div>
    </Section>
  );
}
