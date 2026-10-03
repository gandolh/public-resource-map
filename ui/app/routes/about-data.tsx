import type { ReactNode } from "react";
import type { MetaFunction } from "react-router";
import { ArrowUpRight } from "lucide-react";
import { useI18n } from "~/lib/i18n";
import { usingCarto } from "~/lib/map";

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
      <h2 className="text-[17px] leading-snug font-semibold tracking-[-0.015em] text-fg">{title}</h2>
      <div className="mt-2 space-y-2 text-[14.5px] leading-relaxed text-fg-muted">{children}</div>
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

/**
 * "About the data" (brief 09): the licences the map runs under and the
 * posture the app takes towards its sources, stated where a resident, a
 * publisher or the OSM Foundation can find it.
 */
export default function AboutDataRoute() {
  const { t } = useI18n();

  return (
    <div className="h-full overflow-y-auto pb-20 md:pb-8">
      <article className="mx-auto w-full max-w-[680px] px-4 py-6 md:px-6 md:py-10">
        <h1 className="text-[26px] leading-[1.15] font-semibold tracking-[-0.025em] md:text-[30px]">
          {t("about.title")}
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-fg-muted">{t("about.lead")}</p>

        <Section title={t("about.placesTitle")}>
          <p>{t("about.places")}</p>
          <p>
            <Out href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</Out>
            {" · "}
            <Out href="https://opendatacommons.org/licenses/odbl/">ODbL 1.0</Out>
          </p>
        </Section>

        <Section title={t("about.mapTitle")}>
          <p>{usingCarto ? t("about.mapCarto") : t("about.mapOsm")}</p>
          {usingCarto && (
            <p>
              <Out href="https://carto.com/attributions">© CARTO</Out>
            </p>
          )}
        </Section>

        <Section title={t("about.eventsTitle")}>
          <p>{t("about.events")}</p>
          <p className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-[13.5px] text-fg">
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
