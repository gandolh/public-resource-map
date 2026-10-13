import { useEffect, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams, type MetaFunction } from "react-router";
import { useLogin, useSession, useWardSignIn } from "../../vendor/ward/ward-auth-react.js";
import { AuthErrorNotice, AuthPage, Field, Notice } from "~/components/auth/fields";
import { Button } from "~/components/ui/Button";
import { registerPath, safeNext } from "~/lib/authApi";
import { useI18n } from "~/lib/i18n";

export const meta: MetaFunction = () => [{ title: "Autentificare — CivicMap" }];

/**
 * prm's own login page (brief 24 of Ward's corpus): a username and password
 * checked by prm's server, which works while Ward is down, and "Sign in with
 * Ward" beside it when the server has Ward configured. `?next=` is a browser
 * path inside prm; a favourite asked for while signed out rides along in it.
 */
export default function LoginRoute() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  const session = useSession();
  const { login, pending, error } = useLogin();
  const ward = useWardSignIn();

  // Signed in (here, or already): go where the person was heading.
  useEffect(() => {
    if (session.status === "signed_in") navigate(next.router, { replace: true });
  }, [session.status, navigate, next.router]);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    void login(String(form.get("username") ?? ""), String(form.get("password") ?? ""));
  };

  const reason = session.status === "signed_out" ? session.reason : undefined;
  const wardEnabled = session.status === "signed_out" && session.ward.enabled;

  return (
    <AuthPage title={t("auth.loginTitle")} lead={t("auth.loginLead")}>
      <div className="space-y-3">
        {(reason === "ward_unavailable" || reason === "ward_session_ended") && (
          <Notice tone="neutral">{t(`authError.${reason}`)}</Notice>
        )}
        <AuthErrorNotice error={ward.error} />
      </div>

      <form onSubmit={submit} className="mt-3 space-y-4">
        <Field label={t("auth.username")} name="username" autoComplete="username" required autoFocus />
        <Field label={t("auth.password")} name="password" type="password" autoComplete="current-password" required />
        <AuthErrorNotice error={error} />
        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={pending}>
          {t("auth.submitLogin")}
        </Button>
      </form>

      {wardEnabled && (
        <>
          <div className="my-5 flex items-center gap-3 text-[12px] text-fg-faint" aria-hidden="true">
            <span className="h-px flex-1 bg-line" />
            {t("auth.or")}
            <span className="h-px flex-1 bg-line" />
          </div>
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            disabled={ward.pending}
            onClick={() => {
              ward.reset();
              void ward.signIn({ returnTo: next.browser });
            }}
          >
            {t("auth.withWard")}
          </Button>
        </>
      )}

      <p className="mt-6 text-[13.5px] text-fg-muted">
        {t("auth.noAccount")}{" "}
        <Link to={registerPath(next.browser)} className="font-medium text-accent hover:underline">
          {t("auth.registerLink")}
        </Link>
      </p>
    </AuthPage>
  );
}
