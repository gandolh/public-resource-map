import { useRef, useState, type FormEvent } from "react";
import { useRenameUser } from "../../../vendor/ward/ward-auth-react.js";
import { Button } from "~/components/ui/Button";
import { useI18n } from "~/lib/i18n";
import { AuthErrorNotice, Field, Notice } from "./fields";
import { SettingsSection } from "./SettingsSection";

/**
 * Change the username. Favourites and notifications are keyed by the user id, so a rename
 * cuts nothing off. The server refuses a name another account holds or one that looks like
 * it (`AIice` beside `alice`) with the same `username_taken`.
 */
export function ChangeUsername({ username }: { username: string }) {
  const { t } = useI18n();
  const { renameUser, pending, error, done } = useRenameUser();
  const field = useRef<HTMLInputElement>(null);
  const [same, setSame] = useState(false);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const next = (field.current?.value ?? "").trim();
    setSame(next === username);
    if (next === username) return;
    void renameUser(next).then((ok) => {
      if (!ok) field.current?.focus();
    });
  };

  return (
    <SettingsSection title={t("settings.usernameTitle")} lead={t("settings.usernameLead")}>
      <form onSubmit={submit} className="space-y-4">
        {/* Keyed by the name so the field shows the new one after a rename. */}
        <Field
          key={username}
          ref={field}
          label={t("settings.usernameLabel")}
          name="username"
          type="text"
          autoComplete="username"
          defaultValue={username}
          aria-invalid={error ? true : undefined}
          required
        />
        <AuthErrorNotice error={error} />
        {same && <Notice tone="neutral">{t("settings.usernameSame")}</Notice>}
        {done && !error && !same && <Notice tone="ok">{t("settings.usernameChanged")}</Notice>}
        <Button type="submit" variant="secondary" disabled={pending}>
          {t("settings.usernameSave")}
        </Button>
      </form>
    </SettingsSection>
  );
}
