import { useState, type FormEvent } from "react";
import { AlertTriangle, Loader2, Plus, RefreshCw, Radio } from "lucide-react";
import type { EventSourceDto, RefreshSummary } from "@public-resource-map/shared";
import {
  useCreateSource,
  useOsmSync,
  useRefreshAll,
  useRefreshSource,
  useSetSourceEnabled,
  useSources,
} from "~/hooks/useAdmin";
import { useI18n } from "~/lib/i18n";
import { CITIES } from "~/lib/cities";
import { Button } from "~/components/ui/Button";
import { Skeleton } from "~/components/ui/Skeleton";
import { StateBlock } from "~/components/ui/StateBlock";
import { cn } from "~/lib/utils";

/**
 * Sources (brief 16): what each reads with, how its last run went, and the
 * buttons that run it. A `suspect` run (nothing, or under half the last one)
 * is shown loudly, because that is how a publisher's redesign announces
 * itself: quietly, as fewer events.
 */
export default function SourcesRoute() {
  const { t } = useI18n();
  const { data, isPending, isError, refetch } = useSources();
  const refreshAll = useRefreshAll();
  const [summary, setSummary] = useState<string | null>(null);

  const describe = (s: RefreshSummary | { status: "error"; error: string }, name: string) =>
    "fetched" in s
      ? t("admin.refreshSummary", {
          name,
          fetched: s.fetched,
          fresh: s.new,
          changed: s.changed,
          duplicates: s.duplicates,
          attention: s.needsAttention,
          stale: s.stale,
        })
      : t("admin.refreshFailed", { name, error: s.error ?? "" });

  const runAll = async () => {
    const results = await refreshAll.mutateAsync();
    const names = new Map((data ?? []).map((s) => [s.id, s.name]));
    setSummary(results.map((r) => describe(r, names.get(r.sourceId) ?? r.sourceId)).join(" "));
  };

  return (
    <div className="mx-auto w-full max-w-[1100px] px-6 py-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-semibold tracking-[-0.02em]">{t("admin.sources")}</h1>
          <p className="mt-1 text-[13.5px] text-fg-muted">{t("admin.sourcesLead")}</p>
        </div>
        <Button variant="primary" size="sm" disabled={refreshAll.isPending || !data?.length} onClick={() => void runAll()}>
          {refreshAll.isPending ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          {t("admin.refreshAll")}
        </Button>
      </header>

      {summary && (
        <p role="status" className="mt-4 rounded-lg border border-line bg-surface-2 px-3 py-2 text-[13px]">
          {summary}
        </p>
      )}

      {isPending && (
        <div className="mt-5 space-y-2" aria-label={t("state.loading")}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}
      {isError && (
        <div className="mt-6 rounded-xl border border-line bg-surface">
          <StateBlock
            tone="danger"
            icon={<AlertTriangle size={18} strokeWidth={2} />}
            title={t("state.error")}
            body={t("state.errorBody")}
            action={
              <Button variant="secondary" size="sm" onClick={() => void refetch()}>
                {t("state.retry")}
              </Button>
            }
          />
        </div>
      )}
      {data && data.length === 0 && (
        <div className="mt-6 rounded-xl border border-line bg-surface">
          <StateBlock icon={<Radio size={18} strokeWidth={2} />} title={t("admin.noSources")} body={t("admin.noSourcesBody")} />
        </div>
      )}
      {data && data.length > 0 && (
        <table className="mt-5 w-full border-separate border-spacing-0 text-left text-[13px]">
          <thead>
            <tr className="text-[11.5px] tracking-[0.04em] text-fg-muted uppercase">
              <th scope="col" className="border-b border-line py-2">{t("admin.col.source")}</th>
              <th scope="col" className="border-b border-line py-2">{t("admin.col.health")}</th>
              <th scope="col" className="border-b border-line py-2">{t("admin.col.lastRun")}</th>
              <th scope="col" className="border-b border-line py-2">
                <span className="sr-only">{t("admin.col.actions")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((s) => (
              <SourceRow key={s.id} source={s} onSummary={(r) => setSummary(describe(r, s.name))} />
            ))}
          </tbody>
        </table>
      )}

      <AddSource />
      <OsmSync />
    </div>
  );
}

function Health({ status }: { status: EventSourceDto["lastStatus"] }) {
  const { t } = useI18n();
  if (!status) return <span className="text-fg-faint">{t("admin.health.never")}</span>;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11.5px] font-semibold",
        status === "ok" ? "border-line bg-surface-2 text-fg-muted" : "border-danger/30 bg-danger-weak text-danger",
      )}
    >
      {status !== "ok" && <AlertTriangle size={12} strokeWidth={2.4} aria-hidden="true" />}
      {t(`admin.health.${status}`)}
    </span>
  );
}

function SourceRow({ source, onSummary }: { source: EventSourceDto; onSummary: (r: RefreshSummary) => void }) {
  const { t, dayMonth, time } = useI18n();
  const refresh = useRefreshSource();
  const setEnabled = useSetSourceEnabled();
  return (
    <tr className={cn("align-top", !source.enabled && "opacity-60")}>
      <td className="border-b border-line py-2.5 pr-3">
        <span className="block font-semibold">{source.name}</span>
        <span className="block text-[12px] text-fg-muted">
          {source.city} · {source.mechanism} · <code>{source.adapterKey}</code>
        </span>
      </td>
      <td className="border-b border-line py-2.5 pr-3">
        <Health status={source.lastStatus} />
        {source.lastEventCount !== null && (
          <span className="tnum mt-1 block text-[12px] text-fg-muted">{t("admin.lastCount", { n: source.lastEventCount })}</span>
        )}
      </td>
      <td className="tnum border-b border-line py-2.5 pr-3 text-fg-muted">
        {source.lastRunAt ? `${dayMonth(source.lastRunAt)} · ${time(source.lastRunAt)}` : "—"}
        {source.lastSuccessfulAt && source.lastSuccessfulAt !== source.lastRunAt && (
          <span className="block text-[12px]">
            {t("admin.lastSuccess", { when: `${dayMonth(source.lastSuccessfulAt)} · ${time(source.lastSuccessfulAt)}` })}
          </span>
        )}
      </td>
      <td className="border-b border-line py-2.5 text-right whitespace-nowrap">
        <label className="mr-3 inline-flex items-center gap-1.5 text-[12.5px] text-fg-muted">
          <input
            type="checkbox"
            checked={source.enabled}
            disabled={setEnabled.isPending}
            onChange={(e) => setEnabled.mutate({ id: source.id, enabled: e.target.checked })}
          />
          {t("admin.enabled")}
        </label>
        <Button
          variant="secondary"
          size="sm"
          disabled={!source.enabled || refresh.isPending}
          onClick={() => refresh.mutate(source.id, { onSuccess: onSummary })}
          aria-label={t("admin.refreshOne", { name: source.name })}
        >
          {refresh.isPending ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          {t("admin.refresh")}
        </Button>
        {refresh.isError && <span role="alert" className="mt-1 block text-[12px] text-danger">{refresh.error.message}</span>}
      </td>
    </tr>
  );
}

/** Add a vetted feed: a row, not code (brief 04). */
function AddSource() {
  const { t } = useI18n();
  const create = useCreateSource();
  const [open, setOpen] = useState(false);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const slug = String(form.get("slug") ?? "").trim().toLowerCase();
    create.mutate(
      {
        name: String(form.get("name") ?? ""),
        adapterKey: `ical:${slug}`,
        mechanism: "ical",
        url: String(form.get("url") ?? ""),
        city: String(form.get("city") ?? ""),
      },
      { onSuccess: () => setOpen(false) },
    );
  };

  const input = "h-9 w-full rounded-lg border border-line bg-surface px-3 text-[13.5px]";
  return (
    <section className="mt-8">
      {!open ? (
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
          <Plus size={14} />
          {t("admin.addSource")}
        </Button>
      ) : (
        <form onSubmit={submit} className="max-w-[560px] space-y-3 rounded-xl border border-line bg-surface p-4">
          <h2 className="text-[15px] font-semibold">{t("admin.addSource")}</h2>
          <p className="text-[12.5px] text-fg-muted">{t("admin.addSourceHint")}</p>
          <label className="block text-[12.5px] font-medium">
            {t("admin.field.name")}
            <input name="name" required className={cn(input, "mt-1")} />
          </label>
          <label className="block text-[12.5px] font-medium">
            {t("admin.field.slug")}
            <input name="slug" required pattern="[a-z0-9-]+" className={cn(input, "mt-1")} />
          </label>
          <label className="block text-[12.5px] font-medium">
            {t("admin.field.url")}
            <input name="url" type="url" required className={cn(input, "mt-1")} />
          </label>
          <label className="block text-[12.5px] font-medium">
            {t("admin.field.city")}
            <select name="city" className={cn(input, "mt-1")}>
              {CITIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          {create.isError && <p role="alert" className="text-[12.5px] text-danger">{create.error.message}</p>}
          <div className="flex gap-2">
            <Button type="submit" variant="primary" size="sm" disabled={create.isPending}>
              {t("admin.add")}
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)}>
              {t("area.cancel")}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}

/** Brief 03's OSM sync, per city: places, not events, and no review step. */
function OsmSync() {
  const { t } = useI18n();
  const sync = useOsmSync();
  return (
    <section className="mt-8 border-t border-line pt-6">
      <h2 className="text-[15px] font-semibold">{t("admin.osmTitle")}</h2>
      <p className="mt-1 text-[12.5px] text-fg-muted">{t("admin.osmLead")}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {CITIES.map((c) => (
          <Button key={c.id} variant="secondary" size="sm" disabled={sync.isPending} onClick={() => sync.mutate(c.id)}>
            {sync.isPending && sync.variables === c.id ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            {t("admin.osmSync", { city: c.name })}
          </Button>
        ))}
      </div>
      {sync.data && (
        <p role="status" className="mt-3 text-[13px] text-fg-muted">
          {t("admin.osmResult", { city: sync.data.city, upserted: sync.data.upserted, inserted: sync.data.inserted })}{" "}
          {t("admin.osmRetired", {
            retired: sync.data.retired,
            unretired: sync.data.unretired,
            review: sync.data.eventsToReview,
          })}
        </p>
      )}
      {sync.data && sync.data.retirementHeld > 0 && (
        <p role="alert" className="mt-2 text-[12.5px] text-danger">
          {t("admin.osmHeld", { held: sync.data.retirementHeld })}
        </p>
      )}
      {sync.isError && <p role="alert" className="mt-3 text-[12.5px] text-danger">{sync.error.message}</p>}
    </section>
  );
}
