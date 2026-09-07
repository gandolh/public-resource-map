import { Link } from "react-router";
import type { ReactNode } from "react";
import { BrandMark } from "./BrandMark";
import { useI18n } from "~/lib/i18n";
import { cn } from "~/lib/utils";

/** Auth lives on its own centred surface, never over the map. */
export function AuthCard({
  title,
  body,
  children,
  footer,
}: {
  title: string;
  body: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div className="flex h-full items-center justify-center overflow-y-auto bg-bg px-4 py-10">
      <div className="w-full max-w-[360px]">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-[15px] font-semibold tracking-[-0.02em]">
          <BrandMark size={24} />
          {t("brand")}
        </Link>
        <div className="rounded-xl border border-line bg-surface p-5 shadow-e2">
          <h1 className="text-[20px] leading-tight font-semibold tracking-[-0.02em]">{title}</h1>
          <p className="mt-1.5 mb-5 text-[13.5px] leading-relaxed text-fg-muted">{body}</p>
          {children}
        </div>
        <div className="mt-4 text-center text-[13px] text-fg-muted">{footer}</div>
      </div>
    </div>
  );
}

export function Field({
  label,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12.5px] font-medium text-fg-muted">
        {label}
        {hint && <span className="ml-1 text-fg-faint">({hint})</span>}
      </span>
      <input
        {...props}
        className={cn(
          "h-10 w-full rounded-lg border border-line bg-surface px-3 text-[14px] text-fg",
          "placeholder:text-fg-faint outline-none",
          "transition-[border-color,box-shadow] duration-[120ms]",
          "focus:border-accent-line focus:ring-2 focus:ring-accent/15",
        )}
      />
    </label>
  );
}
