import { useEffect, useMemo, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { useQueries } from "@tanstack/react-query";
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";
import { AlertTriangle, Check, ExternalLink, Inbox, Loader2, MapPin, X } from "lucide-react";
import type { StagedEventDto } from "@public-resource-map/shared";
import { useAccept, useReject, useResolvePlace, useSources, useStaged } from "~/hooks/useAdmin";
import { cityByName } from "~/lib/cities";
import { fetchPlace } from "~/lib/api";
import { useI18n } from "~/lib/i18n";
import { DARK_TILES, LIGHT_TILES, MAP_ATTRIBUTION, useIsDarkMode } from "~/lib/map";
import { Button } from "~/components/ui/Button";
import { Chip } from "~/components/ui/Chip";
import { Skeleton } from "~/components/ui/Skeleton";
import { StateBlock } from "~/components/ui/StateBlock";
import { cn } from "~/lib/utils";

/**
 * The review queue (brief 16). Confidence decides the order: whatever needs a
 * judgement comes first, and what is plainly fine (a new listing already tied
 * to a place) is pre-selected for one bulk accept. The reviewer's attention
 * goes where it is needed, without rubber-stamping the rest.
 */

type Bucket = "attention" | "changed" | "ambiguous" | "venue" | "ready" | "quarantine";

/** Which bucket a row is in. The order of BUCKETS below is the review order. */
function bucketOf(r: StagedEventDto): Bucket {
  if (r.status === "needs-attention") return "quarantine";
  if (r.status === "changed") return "changed";
  if (r.placeId) return "ready";
  if (r.matchStatus === "ambiguous") return "ambiguous";
  // Unmatched: geocoded (a new venue place on accept) or waiting for a pin.
  return r.lat !== null ? "venue" : "attention";
}

const BUCKETS: Bucket[] = ["quarantine", "attention", "ambiguous", "changed", "venue", "ready"];
const rank = (r: StagedEventDto) => BUCKETS.indexOf(bucketOf(r));
/** A row Accept can take as it is. */
const acceptable = (r: StagedEventDto) =>
  r.status !== "needs-attention" && (r.placeId !== null || r.lat !== null);

export default function ReviewRoute() {
  const { t, tn } = useI18n();
  const { data, isPending, isError, refetch } = useStaged();
  const accept = useAccept();
  const reject = useReject();
  const [filter, setFilter] = useState<Bucket | "all">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const rows = useMemo(
    () => [...(data ?? [])].sort((a, b) => rank(a) - rank(b) || a.startDate.localeCompare(b.startDate)),
    [data],
  );
  const counts = useMemo(() => {
    const c = Object.fromEntries(BUCKETS.map((b) => [b, 0])) as Record<Bucket, number>;
    for (const r of rows) c[bucketOf(r)]++;
    return c;
  }, [rows]);
  const visible = filter === "all" ? rows : rows.filter((r) => bucketOf(r) === filter);

  // Pre-select the high-confidence rows whenever a fresh queue arrives.
  const [seededFor, setSeededFor] = useState<StagedEventDto[] | undefined>(undefined);
  if (data && seededFor !== data) {
    setSeededFor(data);
    setSelected(new Set(data.filter((r) => bucketOf(r) === "ready").map((r) => r.id)));
  }

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allVisibleSelected = visible.length > 0 && visible.every((r) => selected.has(r.id));
  const toggleVisible = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      for (const r of visible) {
        if (allVisibleSelected) next.delete(r.id);
        else next.add(r.id);
      }
      return next;
    });

  const chosen = rows.filter((r) => selected.has(r.id));
  const doAccept = async (ids: string[]) => {
    const result = await accept.mutateAsync(ids);
    setMessage(
      result.skipped.length
        ? t("admin.acceptedSkipped", {
            accepted: tn("count.events", result.accepted.length),
            skipped: result.skipped.length,
          })
        : t("admin.accepted", { accepted: tn("count.events", result.accepted.length) }),
    );
    setSelected(new Set());
  };
  const doReject = async (ids: string[]) => {
    const result = await reject.mutateAsync(ids);
    setMessage(t("admin.rejected", { n: result.rejected }));
    setSelected(new Set());
  };

  const open = rows.find((r) => r.id === openId) ?? null;

  return (
    <div className="mx-auto w-full max-w-[1100px] px-6 py-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-semibold tracking-[-0.02em]">{t("admin.review")}</h1>
          <p className="mt-1 text-[13.5px] text-fg-muted">{t("admin.reviewLead")}</p>
        </div>
      </header>

      <div className="mt-5 flex flex-wrap gap-1.5" role="group" aria-label={t("admin.buckets")}>
        <Chip active={filter === "all"} count={rows.length} onClick={() => setFilter("all")}>
          {t("admin.bucket.all")}
        </Chip>
        {BUCKETS.map((b) => (
          <Chip key={b} active={filter === b} count={counts[b]} onClick={() => setFilter(b)}>
            {t(`admin.bucket.${b}`)}
          </Chip>
        ))}
      </div>

      {message && (
        <p role="status" className="mt-4 rounded-lg border border-line bg-surface-2 px-3 py-2 text-[13px]">
          {message}
        </p>
      )}

      {isPending && (
        <div className="mt-5 space-y-2" aria-label={t("state.loading")}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
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

      {!isPending && !isError && rows.length === 0 && (
        <div className="mt-6 rounded-xl border border-line bg-surface">
          <StateBlock icon={<Inbox size={18} strokeWidth={2} />} title={t("admin.emptyTitle")} body={t("admin.emptyBody")} />
        </div>
      )}

      {!isPending && !isError && rows.length > 0 && (
        <>
          {/* The bulk toolbar sticks to the top of the scrolling pane, so it is
              in reach however far down the queue the reviewer is. */}
          <div className="sticky top-0 z-10 -mx-2 mt-4 flex items-center gap-2 bg-bg/95 px-2 py-2 backdrop-blur">
            <span className="tnum text-[13px] text-fg-muted">{t("admin.selected", { n: chosen.length })}</span>
            <Button
              variant="primary"
              size="sm"
              disabled={chosen.length === 0 || accept.isPending}
              onClick={() => void doAccept(chosen.filter(acceptable).map((r) => r.id))}
            >
              {accept.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} strokeWidth={2.4} />}
              {t("admin.acceptSelected")}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={chosen.length === 0 || reject.isPending}
              onClick={() => void doReject(chosen.map((r) => r.id))}
            >
              <X size={14} strokeWidth={2.4} />
              {t("admin.rejectSelected")}
            </Button>
          </div>

          <table className="mt-1 w-full border-separate border-spacing-0 text-left text-[13px]">
            <thead>
              <tr className="text-[11.5px] tracking-[0.04em] text-fg-muted uppercase">
                <th scope="col" className="w-9 border-b border-line py-2 pl-2">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleVisible}
                    aria-label={t("admin.selectAll")}
                  />
                </th>
                <th scope="col" className="border-b border-line py-2">{t("admin.col.event")}</th>
                <th scope="col" className="border-b border-line py-2">{t("admin.col.when")}</th>
                <th scope="col" className="border-b border-line py-2">{t("admin.col.place")}</th>
                <th scope="col" className="border-b border-line py-2">{t("admin.col.state")}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <Row key={r.id} row={r} selected={selected.has(r.id)} onToggle={() => toggle(r.id)} onOpen={() => setOpenId(r.id)} />
              ))}
            </tbody>
          </table>
        </>
      )}

      <Drawer
        row={open}
        onClose={() => setOpenId(null)}
        onAccept={(id) => void doAccept([id]).then(() => setOpenId(null))}
        onReject={(id) => void doReject([id]).then(() => setOpenId(null))}
      />
    </div>
  );
}

function BucketBadge({ row }: { row: StagedEventDto }) {
  const { t } = useI18n();
  const bucket = bucketOf(row);
  const loud = bucket === "quarantine" || bucket === "attention" || bucket === "ambiguous" || bucket === "changed";
  return (
    <span
      className={cn(
        "inline-flex rounded-md border px-1.5 py-0.5 text-[11.5px] font-medium whitespace-nowrap",
        loud ? "border-danger/30 bg-danger-weak text-danger" : "border-line bg-surface-2 text-fg-muted",
      )}
    >
      {t(`admin.bucket.${bucket}`)}
    </span>
  );
}

function Row({
  row,
  selected,
  onToggle,
  onOpen,
}: {
  row: StagedEventDto;
  selected: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  const { t, dayMonth, time } = useI18n();
  const placeLabel = row.placeId
    ? (row.candidates.find((c) => c.placeId === row.placeId)?.name ?? t("admin.placeChosen"))
    : row.lat !== null
      ? t("admin.newVenue", { name: row.venueName ?? "" })
      : (row.venueName ?? "—");
  return (
    <tr className={cn("align-top", selected && "bg-accent-weak/60")}>
      <td className="border-b border-line py-2.5 pl-2">
        <input type="checkbox" checked={selected} onChange={onToggle} aria-label={t("admin.select", { title: row.title })} />
      </td>
      <td className="border-b border-line py-2.5 pr-3">
        <button type="button" onClick={onOpen} className="text-left font-semibold text-fg hover:underline">
          {row.title}
        </button>
        <span className="block text-[12px] text-fg-muted">{row.sourcePlatform}</span>
      </td>
      <td className="tnum border-b border-line py-2.5 pr-3 whitespace-nowrap text-fg-muted">
        {dayMonth(row.startDate)} · {time(row.startDate)}
      </td>
      <td className="border-b border-line py-2.5 pr-3 text-fg-muted">{placeLabel}</td>
      <td className="border-b border-line py-2.5 pr-2">
        <BucketBadge row={row} />
      </td>
    </tr>
  );
}

/**
 * The drawer slides in, so Leaflet first measures a container that is still
 * moving and centres wrong. Measure again once it has settled.
 */
function Settle({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    const id = window.setTimeout(() => {
      map.invalidateSize();
      map.setView([lat, lng], map.getZoom(), { animate: false });
    }, 250);
    return () => window.clearTimeout(id);
  }, [map, lat, lng]);
  return null;
}

/** A click on the preview map drops the pending manual pin. */
function PinDrop({ onPin }: { onPin: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPin(e.latlng.lat, e.latlng.lng) });
  return null;
}

function Drawer({
  row,
  onClose,
  onAccept,
  onReject,
}: {
  row: StagedEventDto | null;
  onClose: () => void;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const { t, longDate, time } = useI18n();
  const dark = useIsDarkMode();
  const resolve = useResolvePlace();
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);

  // A new row starts with no pending pin and no error from the last one.
  const [shownId, setShownId] = useState<string | null>(null);
  if ((row?.id ?? null) !== shownId) {
    setShownId(row?.id ?? null);
    setPin(null);
  }
  const { reset } = resolve;
  const rowId = row?.id;
  useEffect(() => reset(), [rowId, reset]);
  const error = resolve.isError ? resolve.error.message : null;

  // Coordinates for the matched place and each candidate, for the preview.
  const placeIds = row ? [...new Set([row.placeId, ...row.candidates.map((c) => c.placeId)].filter(Boolean) as string[])] : [];
  const places = useQueries({
    queries: placeIds.map((id) => ({ queryKey: ["place", id], queryFn: () => fetchPlace(id) })),
  });
  const known = places.flatMap((q) => (q.data ? [q.data] : []));
  const chosen = known.find((p) => p.id === row?.placeId) ?? null;

  // With nothing to show yet, open on the source's city, so a pin can be dropped.
  const { data: sources } = useSources();
  const sourceCity = cityByName(sources?.find((s) => s.id === row?.sourceId)?.city ?? undefined);
  const center =
    pin ??
    (chosen ? chosen.coordinates : null) ??
    (row?.lat != null ? { lat: row.lat, lng: row.lng! } : null) ??
    known[0]?.coordinates ??
    sourceCity?.center ??
    null;

  const choosePlace = (placeId: string) => row && resolve.mutate({ id: row.id, input: { placeId } });
  const choosePin = () => row && pin && resolve.mutate({ id: row.id, input: pin }, { onSuccess: () => setPin(null) });

  const quarantined = row?.status === "needs-attention";

  return (
    <Dialog.Root open={row !== null} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[900] bg-black/30" />
        <Dialog.Popup className="fixed top-0 right-0 z-[901] flex h-[100dvh] w-[min(100vw,480px)] flex-col border-l border-line bg-surface shadow-e3 outline-none">
          {row && (
            <>
              <div className="flex items-start justify-between gap-3 border-b border-line p-4">
                <div className="min-w-0">
                  <Dialog.Title className="text-[17px] leading-snug font-semibold">{row.title}</Dialog.Title>
                  <Dialog.Description className="mt-0.5 text-[12.5px] text-fg-muted">
                    {row.sourcePlatform} · <BucketBadge row={row} />
                  </Dialog.Description>
                </div>
                <Dialog.Close
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-fg-muted hover:bg-surface-2"
                  aria-label={t("admin.close")}
                >
                  <X size={16} />
                </Dialog.Close>
              </div>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 text-[13.5px]">
                {quarantined && row.issues && (
                  <p className="rounded-lg border border-danger/30 bg-danger-weak px-3 py-2 text-danger">
                    {t("admin.issues", { issues: row.issues })}
                  </p>
                )}
                {row.cancelled && (
                  <p className="rounded-lg border border-danger/30 bg-danger-weak px-3 py-2 text-danger">{t("admin.cancelled")}</p>
                )}

                <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-1.5">
                  <dt className="text-fg-muted">{t("admin.col.when")}</dt>
                  <dd className="tnum">
                    {longDate(row.startDate)}, {time(row.startDate)}
                    {row.endDate && ` – ${time(row.endDate)}`}
                  </dd>
                  <dt className="text-fg-muted">{t("admin.venue")}</dt>
                  <dd>{row.venueName ?? "—"}</dd>
                  {row.rawAddress && (
                    <>
                      <dt className="text-fg-muted">{t("admin.address")}</dt>
                      <dd>{row.rawAddress}</dd>
                    </>
                  )}
                  {row.price !== null && (
                    <>
                      <dt className="text-fg-muted">{t("admin.price")}</dt>
                      <dd className="tnum">
                        {row.price} {row.currency}
                      </dd>
                    </>
                  )}
                  {row.sourceUrl && (
                    <>
                      <dt className="text-fg-muted">{t("admin.listing")}</dt>
                      <dd>
                        <a href={row.sourceUrl} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-accent hover:underline">
                          {new URL(row.sourceUrl).hostname}
                          <ExternalLink size={12} />
                        </a>
                      </dd>
                    </>
                  )}
                </dl>
                {row.description && <p className="whitespace-pre-line text-fg-muted">{row.description}</p>}

                {!quarantined && (
                  <section aria-labelledby="where" className="space-y-2">
                    <h3 id="where" className="text-[12px] font-semibold tracking-[0.04em] text-fg-muted uppercase">
                      {t("admin.where")}
                    </h3>
                    <div className="h-[220px] overflow-hidden rounded-lg border border-line">
                      {center ? (
                        <MapContainer key={row.id} center={[center.lat, center.lng]} zoom={15} className="h-full w-full" attributionControl>
                          <TileLayer url={dark ? DARK_TILES : LIGHT_TILES} attribution={MAP_ATTRIBUTION} />
                          <Settle lat={center.lat} lng={center.lng} />
                          <PinDrop onPin={(lat, lng) => setPin({ lat, lng })} />
                          {known.map((p) => (
                            <CircleMarker
                              key={p.id}
                              center={[p.coordinates.lat, p.coordinates.lng]}
                              radius={p.id === row.placeId ? 9 : 6}
                              pathOptions={{ className: p.id === row.placeId ? "cm-area" : "cm-area-corner" }}
                            >
                              <Tooltip>{p.name}</Tooltip>
                            </CircleMarker>
                          ))}
                          {row.lat !== null && !row.placeId && (
                            <CircleMarker center={[row.lat, row.lng!]} radius={8} pathOptions={{ className: "cm-area" }}>
                              <Tooltip>{t("admin.geocoded")}</Tooltip>
                            </CircleMarker>
                          )}
                          {pin && <CircleMarker center={[pin.lat, pin.lng]} radius={8} pathOptions={{ className: "cm-area-draft" }} />}
                        </MapContainer>
                      ) : (
                        <p className="grid h-full place-items-center px-6 text-center text-fg-muted">{t("admin.noLocation")}</p>
                      )}
                    </div>
                    <p className="text-[12px] text-fg-faint">{t("admin.pinHint")}</p>

                    {row.candidates.length > 0 && (
                      <ul className="space-y-1.5">
                        {row.candidates.map((c) => (
                          <li key={c.placeId} className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2">
                            <span className="min-w-0">
                              <span className="block truncate font-medium">{c.name}</span>
                              <span className="tnum text-[12px] text-fg-muted">{t("admin.score", { score: Math.round(c.score * 100) })}</span>
                            </span>
                            {c.placeId === row.placeId ? (
                              <span className="text-[12px] font-semibold text-accent">{t("admin.chosen")}</span>
                            ) : (
                              <Button variant="secondary" size="sm" disabled={resolve.isPending} onClick={() => choosePlace(c.placeId)}>
                                {t("admin.useThisPlace")}
                              </Button>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                    {pin && (
                      <Button variant="secondary" size="sm" disabled={resolve.isPending} onClick={choosePin}>
                        <MapPin size={14} />
                        {t("admin.useThisPin")}
                      </Button>
                    )}
                    {error && <p role="alert" className="text-[12.5px] text-danger">{error}</p>}
                  </section>
                )}
              </div>

              <div className="flex gap-2 border-t border-line p-4">
                {!quarantined && (
                  <Button variant="primary" size="sm" disabled={!acceptable(row)} onClick={() => onAccept(row.id)}>
                    <Check size={14} strokeWidth={2.4} />
                    {row.status === "changed" ? t("admin.acceptChange") : t("admin.accept")}
                  </Button>
                )}
                <Button variant="secondary" size="sm" onClick={() => onReject(row.id)}>
                  <X size={14} strokeWidth={2.4} />
                  {t("admin.reject")}
                </Button>
                {!quarantined && !acceptable(row) && (
                  <span className="self-center text-[12px] text-fg-muted">{t("admin.needsPlace")}</span>
                )}
              </div>
            </>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
