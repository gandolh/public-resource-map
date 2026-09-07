import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { LocalStorage } from "./LocalStorage";

/**
 * Romanian leads because the audience is residents; English exists so the POC
 * can be demoed to someone who does not read Romanian.
 *
 * No translation framework. The two things a framework would actually be
 * needed for — Romanian's three plural forms (including the "de" form above
 * nineteen: *20 de evenimente*) and date formatting in Europe/Bucharest — are
 * already in the platform as `Intl.PluralRules` and `Intl.DateTimeFormat`.
 * Adding i18next to reach them would be a dependency for a lookup table.
 */
export type Lang = "ro" | "en";

export const LANGS: Lang[] = ["ro", "en"];
const STORAGE_KEY = "civicmap-lang";

/** Every user-facing date is a Bucharest date, whatever the visitor's clock says. */
export const APP_TZ = "Europe/Bucharest";

type Dict = Record<string, string>;

const ro: Dict = {
  "brand": "CivicMap",
  "nav.map": "Hartă",
  "nav.whatsOn": "Ce se întâmplă",
  "nav.account": "Cont",
  "nav.login": "Autentificare",
  "nav.register": "Cont nou",
  "nav.logout": "Contul meu",
  "auth.unavailable": "Autentificarea nu e disponibilă acum",
  "nav.menu": "Meniu",

  "city.label": "Oraș",
  "city.change": "Schimbă orașul",

  "search.placeholder": "Caută un loc",
  "search.clear": "Șterge căutarea",
  "search.noMatch": "Niciun loc nu se potrivește cu „{q}”",

  "filters.title": "Categorii",
  "filters.all": "Toate",
  "filters.clear": "Șterge filtrele",
  "filters.more": "+{n}",
  "filters.showLess": "Mai puține",

  "lens.label": "Când",
  "lens.today": "Azi",
  "lens.weekend": "Weekend",
  "lens.all": "Oricând",

  "count.places_one": "{n} loc",
  "count.places_few": "{n} locuri",
  "count.places_other": "{n} de locuri",
  "count.events_one": "{n} eveniment",
  "count.events_few": "{n} evenimente",
  "count.events_other": "{n} de evenimente",
  "count.withEvents_one": "{n} cu program",
  "count.withEvents_few": "{n} cu program",
  "count.withEvents_other": "{n} cu program",

  "place.address": "Adresă",
  "place.hours": "Program",
  "place.phone": "Telefon",
  "place.website": "Site",
  "place.source": "Sursă",
  "place.sourceOsm": "OpenStreetMap",
  "place.sourceVenue": "Din calendarul organizatorului",
  "place.whatsOnHere": "Ce se întâmplă aici",
  "place.directions": "Indicații",
  "place.share": "Copiază linkul",
  "place.shared": "Link copiat",
  "place.close": "Închide panoul",
  "place.showAll": "Vezi toate {n}",
  "place.showLess": "Arată mai puține",
  "place.openFull": "Deschide pagina locului",
  "place.backToMap": "Înapoi la hartă",
  "place.onMap": "Vezi pe hartă",

  "place.noEvents": "Nimic programat aici",
  "place.noEventsBody":
    "Locul rămâne pe hartă — evenimentele sunt rare și apar doar când le publică organizatorul.",
  "place.noEventsLens": "Nimic {lens} aici",
  "place.noEventsLensBody": "Încearcă „Oricând” ca să vezi tot ce urmează.",

  "event.free": "Intrare liberă",
  "event.tickets": "Bilete",
  "event.noTicketLink": "Fără link de bilete",
  "event.at": "la",

  "group.today": "Azi",
  "group.tomorrow": "Mâine",
  "group.weekend": "În weekend",
  "group.later": "Mai târziu",

  "whatsOn.title": "Ce se întâmplă în {city}",
  "whatsOn.subtitle": "Tot ce urmează, la locurile din oraș.",
  "whatsOn.empty": "Nimic programat momentan",
  "whatsOn.emptyBody":
    "Evenimentele vin din calendarele publice ale organizatorilor și sunt rare. Harta rămâne utilă oricum.",

  "state.loading": "Se încarcă",
  "state.error": "Nu am putut încărca datele",
  "state.errorBody": "Verifică conexiunea și încearcă din nou.",
  "state.retry": "Încearcă din nou",
  "state.zeroTitle": "Niciun loc nu trece de filtre",
  "state.zeroBody": "Scoate un filtru ca să vezi mai multe.",
  "state.zeroLens": "Nimic {lens} în {city}",

  "map.recenter": "Centrează pe mine",
  "map.zoomIn": "Apropie",
  "map.zoomOut": "Depărtează",
  "map.locating": "Te caut…",
  "map.locationDenied": "Locația nu e disponibilă — harta merge și fără ea.",
  "map.cluster": "{n} locuri — apropie ca să le vezi",

  "theme.toggle": "Schimbă tema",
  "theme.light": "Luminos",
  "theme.dark": "Întunecat",
  "theme.system": "Ca sistemul",
  "lang.toggle": "Change language",

  "cat.park": "Parcuri",
  "cat.library": "Biblioteci",
  "cat.clinic": "Clinici",
  "cat.museum": "Muzee",
  "cat.townhall": "Primării",
  "cat.community_center": "Centre comunitare",
  "cat.education": "Educație",
  "cat.theater": "Teatre",
  "cat.sports": "Sport",
  "cat.cultural_center": "Centre culturale",
  "cat.other": "Altele",

  "cat.one.park": "Parc",
  "cat.one.library": "Bibliotecă",
  "cat.one.clinic": "Clinică",
  "cat.one.museum": "Muzeu",
  "cat.one.townhall": "Primărie",
  "cat.one.community_center": "Centru comunitar",
  "cat.one.education": "Educație",
  "cat.one.theater": "Teatru",
  "cat.one.sports": "Sport",
  "cat.one.cultural_center": "Centru cultural",
  "cat.one.other": "Alt loc public",

  "ev.concert": "Concert",
  "ev.theater": "Teatru",
  "ev.sport": "Sport",
  "ev.community": "Comunitate",
  "ev.festival": "Festival",
  "ev.exhibition": "Expoziție",
  "ev.workshop": "Atelier",
  "ev.other": "Eveniment",

  "auth.loginTitle": "Bine ai revenit",
  "auth.loginBody": "Intră în cont ca să-ți vezi locurile salvate.",
  "auth.registerTitle": "Cont nou",
  "auth.registerBody": "Salvează locuri și primești o notificare când apare ceva la ele.",
  "auth.email": "Email",
  "auth.password": "Parolă",
  "auth.displayName": "Nume afișat",
  "auth.optional": "opțional",
  "auth.signIn": "Intră în cont",
  "auth.signingIn": "Se conectează…",
  "auth.createAccount": "Creează contul",
  "auth.creating": "Se creează…",
  "auth.noAccount": "N-ai cont?",
  "auth.haveAccount": "Ai deja cont?",
  "auth.failed": "Autentificarea a eșuat",
  "auth.registerFailed": "Nu am putut crea contul",
  "auth.checkEmail": "Verifică-ți emailul",
  "auth.checkEmailBody":
    "Ți-am trimis un link de confirmare. După ce confirmi, te poți autentifica.",
  "auth.backToMap": "Înapoi la hartă",
};

const en: Dict = {
  "brand": "CivicMap",
  "nav.map": "Map",
  "nav.whatsOn": "What's on",
  "nav.account": "Account",
  "nav.login": "Log in",
  "nav.register": "Create account",
  "nav.logout": "My account",
  "auth.unavailable": "Sign-in is unavailable right now",
  "nav.menu": "Menu",

  "city.label": "City",
  "city.change": "Change city",

  "search.placeholder": "Search for a place",
  "search.clear": "Clear search",
  "search.noMatch": "No place matches “{q}”",

  "filters.title": "Categories",
  "filters.all": "All",
  "filters.clear": "Clear filters",
  "filters.more": "+{n}",
  "filters.showLess": "Fewer",

  "lens.label": "When",
  "lens.today": "Today",
  "lens.weekend": "Weekend",
  "lens.all": "Anytime",

  "count.places_one": "{n} place",
  "count.places_other": "{n} places",
  "count.events_one": "{n} event",
  "count.events_other": "{n} events",
  "count.withEvents_one": "{n} with events",
  "count.withEvents_other": "{n} with events",

  "place.address": "Address",
  "place.hours": "Hours",
  "place.phone": "Phone",
  "place.website": "Website",
  "place.source": "Source",
  "place.sourceOsm": "OpenStreetMap",
  "place.sourceVenue": "From the organiser's calendar",
  "place.whatsOnHere": "What's on here",
  "place.directions": "Directions",
  "place.share": "Copy link",
  "place.shared": "Link copied",
  "place.close": "Close panel",
  "place.showAll": "Show all {n}",
  "place.showLess": "Show fewer",
  "place.openFull": "Open place page",
  "place.backToMap": "Back to the map",
  "place.onMap": "Show on map",

  "place.noEvents": "Nothing scheduled here",
  "place.noEventsBody":
    "The place stays on the map — events are sparse and only appear once an organiser publishes them.",
  "place.noEventsLens": "Nothing {lens} here",
  "place.noEventsLensBody": "Try “Anytime” to see everything coming up.",

  "event.free": "Free entry",
  "event.tickets": "Tickets",
  "event.noTicketLink": "No ticket link",
  "event.at": "at",

  "group.today": "Today",
  "group.tomorrow": "Tomorrow",
  "group.weekend": "This weekend",
  "group.later": "Later",

  "whatsOn.title": "What's on in {city}",
  "whatsOn.subtitle": "Everything coming up, at places across the city.",
  "whatsOn.empty": "Nothing scheduled right now",
  "whatsOn.emptyBody":
    "Events come from organisers' public calendars and are sparse. The map is useful either way.",

  "state.loading": "Loading",
  "state.error": "Couldn't load this",
  "state.errorBody": "Check your connection and try again.",
  "state.retry": "Try again",
  "state.zeroTitle": "No place passes these filters",
  "state.zeroBody": "Remove a filter to see more.",
  "state.zeroLens": "Nothing {lens} in {city}",

  "map.recenter": "Centre on me",
  "map.zoomIn": "Zoom in",
  "map.zoomOut": "Zoom out",
  "map.locating": "Finding you…",
  "map.locationDenied": "Location unavailable — the map works without it.",
  "map.cluster": "{n} places — zoom in to separate them",

  "theme.toggle": "Switch theme",
  "theme.light": "Light",
  "theme.dark": "Dark",
  "theme.system": "System",
  "lang.toggle": "Schimbă limba",

  "cat.park": "Parks",
  "cat.library": "Libraries",
  "cat.clinic": "Clinics",
  "cat.museum": "Museums",
  "cat.townhall": "Town halls",
  "cat.community_center": "Community centres",
  "cat.education": "Education",
  "cat.theater": "Theatres",
  "cat.sports": "Sport",
  "cat.cultural_center": "Cultural centres",
  "cat.other": "Other",

  "cat.one.park": "Park",
  "cat.one.library": "Library",
  "cat.one.clinic": "Clinic",
  "cat.one.museum": "Museum",
  "cat.one.townhall": "Town hall",
  "cat.one.community_center": "Community centre",
  "cat.one.education": "Education",
  "cat.one.theater": "Theatre",
  "cat.one.sports": "Sport",
  "cat.one.cultural_center": "Cultural centre",
  "cat.one.other": "Public place",

  "ev.concert": "Concert",
  "ev.theater": "Theatre",
  "ev.sport": "Sport",
  "ev.community": "Community",
  "ev.festival": "Festival",
  "ev.exhibition": "Exhibition",
  "ev.workshop": "Workshop",
  "ev.other": "Event",

  "auth.loginTitle": "Welcome back",
  "auth.loginBody": "Sign in to see the places you saved.",
  "auth.registerTitle": "Create an account",
  "auth.registerBody": "Save places and get told when something is on at them.",
  "auth.email": "Email",
  "auth.password": "Password",
  "auth.displayName": "Display name",
  "auth.optional": "optional",
  "auth.signIn": "Sign in",
  "auth.signingIn": "Signing in…",
  "auth.createAccount": "Create account",
  "auth.creating": "Creating…",
  "auth.noAccount": "No account?",
  "auth.haveAccount": "Already have an account?",
  "auth.failed": "Sign-in failed",
  "auth.registerFailed": "Couldn't create the account",
  "auth.checkEmail": "Check your email",
  "auth.checkEmailBody":
    "We sent you a confirmation link. Once you confirm it, you can sign in.",
  "auth.backToMap": "Back to the map",
};

const DICTS: Record<Lang, Dict> = { ro, en };

function interpolate(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in vars ? String(vars[key]) : whole,
  );
}

interface I18n {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Look up a key. Falls back to Romanian, then to the key itself. */
  t: (key: string, vars?: Record<string, string | number>) => string;
  /**
   * Plural form for a count. Romanian picks between one / few / other, which is
   * what produces "1 eveniment", "3 evenimente" and "24 de evenimente".
   */
  tn: (key: string, count: number, vars?: Record<string, string | number>) => string;
  /** 19:00 */
  time: (iso: string) => string;
  /** 4 sep. */
  dayMonth: (iso: string) => string;
  /** vineri, 4 septembrie */
  longDate: (iso: string) => string;
  /** Bucharest calendar day as YYYY-MM-DD, for grouping. */
  dayKey: (iso: string) => string;
}

const I18nContext = createContext<I18n | null>(null);

/**
 * Romanian is the default, unconditionally. Browser language is deliberately
 * ignored: the audience is residents of two Romanian cities, and a Romanian
 * with an English-locale phone should still land in Romanian. English is a
 * choice someone makes, and it is then remembered.
 */
function detectLang(): Lang {
  const stored = LocalStorage.get<string>(STORAGE_KEY);
  return stored === "en" ? "en" : "ro";
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Start from the default on both the first client render and any prerender,
  // then settle to the stored/detected value — otherwise the markup React
  // builds and the markup it hydrates disagree.
  const [lang, setLangState] = useState<Lang>("ro");

  useEffect(() => {
    setLangState(detectLang());
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    LocalStorage.set(STORAGE_KEY, next);
    setLangState(next);
  }, []);

  const value = useMemo<I18n>(() => {
    const dict = DICTS[lang];
    const plural = new Intl.PluralRules(lang);
    const timeFmt = new Intl.DateTimeFormat(lang, {
      timeZone: APP_TZ, hour: "2-digit", minute: "2-digit", hour12: false,
    });
    const dayMonthFmt = new Intl.DateTimeFormat(lang, {
      timeZone: APP_TZ, day: "numeric", month: "short",
    });
    const longFmt = new Intl.DateTimeFormat(lang, {
      timeZone: APP_TZ, weekday: "long", day: "numeric", month: "long",
    });
    const keyFmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: APP_TZ, year: "numeric", month: "2-digit", day: "2-digit",
    });

    const t = (key: string, vars?: Record<string, string | number>) =>
      interpolate(dict[key] ?? ro[key] ?? key, vars);

    return {
      lang,
      setLang,
      t,
      tn: (key, count, vars) => {
        const form = plural.select(count);
        const raw =
          dict[`${key}_${form}`] ??
          dict[`${key}_other`] ??
          ro[`${key}_${form}`] ??
          ro[`${key}_other`] ??
          key;
        return interpolate(raw, { n: count, ...vars });
      },
      time: (iso) => timeFmt.format(new Date(iso)),
      dayMonth: (iso) => dayMonthFmt.format(new Date(iso)),
      longDate: (iso) => longFmt.format(new Date(iso)),
      dayKey: (iso) => keyFmt.format(new Date(iso)),
    };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
