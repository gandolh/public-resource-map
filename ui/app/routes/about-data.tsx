import type { ReactNode } from "react";
import type { MetaFunction } from "react-router";
import { ArrowUpRight } from "lucide-react";
import { SOURCES, sourceById, type SourceEntry } from "@public-resource-map/shared";
import { useI18n, type Lang } from "~/lib/i18n";
import { TILE_SOURCE, usingCarto } from "~/lib/map";

export const meta: MetaFunction = () => [
  { title: "Despre date — CivicMap" },
  {
    name: "description",
    content: "De unde vin locurile și evenimentele din CivicMap, sub ce licențe, și cum ceri eliminarea unei surse.",
  },
];

/**
 * Where a source publisher writes to be removed. Configured per deploy, never
 * guessed: an address on this page is a promise someone reads that inbox.
 */
const CONTACT = (import.meta.env.VITE_DATA_CONTACT as string | undefined)?.trim() || null;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8 first:mt-6">
      <h2 className="text-title leading-snug font-semibold tracking-[-0.015em] text-fg">{title}</h2>
      <div className="mt-2 space-y-2 text-reading leading-relaxed text-fg-muted">{children}</div>
    </section>
  );
}

function Out({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="inline-flex items-center gap-0.5 font-medium text-accent hover:underline"
    >
      {children}
      <ArrowUpRight size={13} strokeWidth={2.5} aria-hidden="true" />
    </a>
  );
}

/** A source's credit from the registry, linked; with its licence when that has a page of its own. */
function Credit({ source, lang }: { source: SourceEntry | undefined; lang: Lang }) {
  if (!source) return null;
  const { url, name } = source.licence;
  return (
    <p>
      <Out href={source.attributionUrl}>{source.attribution[lang]}</Out>
      {url && url !== source.attributionUrl && (
        <>
          {" · "}
          <Out href={url}>{name}</Out>
        </>
      )}
    </p>
  );
}

/** The event publishers the app may show, from the registry: a forbidden one is not on the map. */
const PUBLISHERS = SOURCES.filter((s) => s.kind === "event-publisher" && s.reuse !== "forbidden");

/**
 * "About the data": the licences the map runs under and the
 * posture the app takes towards its sources, stated where a resident, a
 * publisher or the OSM Foundation can find it. The credits come from the source registry
 * (`shared/src/sources.ts`); the prose is the dictionary's.
 */
export default function AboutDataRoute() {
  const { t, lang } = useI18n();

  return (
    <div className="h-full overflow-y-auto pb-20 md:pb-8">
      <article className="mx-auto w-full max-w-[680px] px-4 py-6 md:px-6 md:py-10">
        <h1 className="text-hero font-semibold tracking-[-0.015em]">{t("about.title")}</h1>
        <p className="mt-2 text-lead leading-relaxed text-fg-muted">{t("about.lead")}</p>

        <Section title={t("about.placesTitle")}>
          <p>{t("about.places")}</p>
          <Credit source={sourceById("openstreetmap")} lang={lang} />
        </Section>

        <Section title={t("about.mapTitle")}>
          <p>{usingCarto ? t("about.mapCarto") : t("about.mapOsm")}</p>
          {/* The OSM tiles' credit is the places' credit, already above. */}
          {usingCarto && <Credit source={sourceById(TILE_SOURCE)} lang={lang} />}
        </Section>

        <Section title={t("about.eventsTitle")}>
          <p>{t("about.events")}</p>
          {PUBLISHERS.length > 0 && (
            <p>
              {t("about.publishers")}{" "}
              {PUBLISHERS.map((s, i) => (
                <span key={s.id}>
                  {i > 0 && " · "}
                  <Out href={s.attributionUrl}>{s.attribution[lang]}</Out>
                </span>
              ))}
            </p>
          )}
          <p className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-control text-fg">
            {t("about.eventsSample")}
          </p>
        </Section>

        <Section title={t("about.notTitle")}>
          <p>{t("about.notTickets")}</p>
          <p>{t("about.notAggregators")}</p>
          <p>{t("about.iabilet")}</p>
        </Section>

        <Section title={t("about.removeTitle")}>
          <p>{t("about.remove")}</p>
          {CONTACT ? (
            <p>
              <a href={`mailto:${CONTACT}`} className="font-medium text-accent hover:underline">
                {CONTACT}
              </a>
            </p>
          ) : (
            <p>{t("about.removeNoContact")}</p>
          )}
        </Section>
      </article>
    </div>
  );
}
