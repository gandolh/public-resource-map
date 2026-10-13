import { useEffect, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams, type MetaFunction } from "react-router";
import { useRegister, useSession } from "../../vendor/ward/ward-auth-react.js";
import { AuthErrorNotice, AuthPage, Field, Notice } from "~/components/auth/fields";
import { Button } from "~/components/ui/Button";
import { loginPath, safeNext } from "~/lib/authApi";
import { useI18n } from "~/lib/i18n";

export const meta: MetaFunction = () => [{ title: "Cont nou — CivicMap" }];

/** The library's minimum (`MIN_PASSWORD_LENGTH`); the server is what enforces it. */
const MIN_PASSWORD = 8;

/**
 * prm's own register page (brief 24 of Ward's corpus; the owner chose a
 * local page on 2026-10-13). prm is the one app in the estate with one. A
 * username and a password, and no email: Ward holds addresses, so a person
 * who wants mail links a Ward account from settings.
 */
export default function RegisterRoute() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  const session = useSession();
  const { register, pending, error } = useRegister();

  useEffect(() => {
    if (session.status === "signed_in") navigate(next.router, { replace: true });
  }, [session.status, navigate, next.router]);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    void register(String(form.get("username") ?? ""), String(form.get("password") ?? ""));
  };

  return (
    <AuthPage title={t("auth.registerTitle")} lead={t("auth.registerLead")}>
      <form onSubmit={submit} className="space-y-4">
        <Field label={t("auth.username")} name="username" autoComplete="username" required autoFocus />
        <Field
          label={t("auth.password")}
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD}
          hint={t("auth.passwordHint", { n: MIN_PASSWORD })}
          required
        />
        <AuthErrorNotice error={error} />
        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={pending}>
          {t("auth.submitRegister")}
        </Button>
      </form>

      <div className="mt-5">
        <Notice tone="neutral">{t("auth.mailNote")}</Notice>
      </div>

      <p className="mt-6 text-[13.5px] text-fg-muted">
        {t("auth.haveAccount")}{" "}
        <Link to={loginPath(next.browser)} className="font-medium text-accent hover:underline">
          {t("auth.loginLink")}
        </Link>
      </p>
    </AuthPage>
  );
}
