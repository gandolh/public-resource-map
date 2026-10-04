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
  "filters.remove": "Scoate filtrul {filter}",
  "state.widenArea": "Fără zona desenată: {places}.",
  "state.widenSearch": "Fără căutare: {places}.",
  "lens.bannerToday": "Doar locuri cu program azi: {places}",
  "lens.bannerWeekend": "Doar locuri cu program în weekend: {places}",
  "lens.showAll": "Arată tot",
  "map.attribution": "Sursele hărții",
  "filters.more": "+{n}",
  "filters.showLess": "Mai puține",
  "area.draw": "Desenează o zonă",
  "area.tool": "Cum desenezi",
  "area.freehand": "Liber",
  "area.polygon": "Poligon",
  "area.hintFreehand": "Încercuiește zona: ține apăsat și trage.",
  "area.hintPolygon": "Atinge harta ca să pui colțurile, apoi Gata.",
  "area.undo": "Înapoi",
  "area.done": "Gata",
  "area.cancel": "Anulează",
  "area.redraw": "Redesenează",
  "area.chip": "Zona desenată",
  "area.remove": "Scoate zona desenată",
  "area.zeroTitle": "Niciun loc în zona desenată",
  "area.cleared": "Zona desenată a fost ștearsă: era în alt oraș.",
  "count.inArea_one": "{n} loc în zonă",
  "count.inArea_few": "{n} locuri în zonă",
  "count.inArea_other": "{n} de locuri în zonă",

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
  "event.source": "Sursa:",
  "nav.aboutData": "Despre date",
  "nav.archive": "Arhivă",
  "archive.title": "Arhivă",
  "archive.subtitle": "Ce s-a întâmplat la locurile publice, și unde.",
  "archive.mine": "Evenimentele mele",
  "archive.city": "Tot din {city}",
  "archive.mineSignIn": "Conectează-te ca să-ți vezi istoricul",
  "archive.mineSignInBody": "Aici apar evenimentele salvate și cele de la locurile pe care le urmărești, după ce au trecut.",
  "archive.mineEmpty": "Încă nimic în istoricul tău",
  "archive.mineEmptyBody": "Salvează evenimente sau urmărește locuri: după ce trec, apar aici.",
  "archive.cityEmpty": "Niciun eveniment trecut înregistrat în {city}",
  "archive.cityEmptyBody": "Evenimentele apar aici după ce s-au încheiat.",
  "archive.more": "Mai multe",
  "archive.link": "Evenimente trecute",
  "fav.place.add": "Urmărește {name}",
  "fav.place.remove": "Nu mai urmări {name}",
  "fav.event.add": "Amintește-mi de {name}",
  "fav.event.remove": "Fără amintire pentru {name}",
  "fav.place.why": "Urmărește locurile care îți plac",
  "fav.event.why": "Primește o amintire cu o zi înainte",
  "fav.signInBody": "Conectează-te ca să afli când apar evenimente noi și să primești amintiri.",
  "bell.label": "Notificări",
  "bell.labelUnread": "Notificări, {n} necitite",
  "bell.empty": "Nimic nou deocamdată.",
  "bell.newEvents_one": "{n} eveniment nou la {place}",
  "bell.newEvents_few": "{n} evenimente noi la {place}",
  "bell.newEvents_other": "{n} de evenimente noi la {place}",
  "bell.reminder": "Mâine: {title}, la {place}",
  "admin.title": "Administrare",
  "admin.review": "De revizuit",
  "admin.sources": "Surse",
  "admin.exit": "Înapoi la site",
  "admin.signedInAs": "Conectat ca {name}",
  "admin.signInTitle": "Autentifică-te ca administrator",
  "admin.signInBody": "Zona de administrare e doar pentru conturile cu drept de administrator în CivicMap.",
  "admin.forbiddenTitle": "Nu ai acces aici",
  "admin.forbiddenBody": "Contul tău nu are drept de administrator în CivicMap.",
  "admin.reviewLead": "Evenimentele preluate așteaptă aici. Nimic nu apare pe hartă până nu e acceptat.",
  "admin.buckets": "Categorii de revizuire",
  "admin.bucket.all": "Toate",
  "admin.bucket.quarantine": "Neclare",
  "admin.bucket.attention": "Fără loc",
  "admin.bucket.ambiguous": "Loc incert",
  "admin.bucket.changed": "Modificate",
  "admin.bucket.venue": "Loc nou",
  "admin.bucket.ready": "Gata",
  "admin.selected": "{n} selectate",
  "admin.selectAll": "Selectează tot ce se vede",
  "admin.select": "Selectează „{title}”",
  "admin.acceptSelected": "Acceptă selecția",
  "admin.rejectSelected": "Respinge selecția",
  "admin.accepted": "Acceptat: {accepted}.",
  "admin.acceptedSkipped": "Acceptat: {accepted}. {skipped} nu au încă un loc.",
  "admin.rejected": "Respinse: {n}.",
  "admin.emptyTitle": "Nimic de revizuit",
  "admin.emptyBody": "Rulează o actualizare din Surse.",
  "admin.col.event": "Eveniment",
  "admin.col.when": "Când",
  "admin.col.place": "Loc",
  "admin.col.state": "Stare",
  "admin.col.source": "Sursă",
  "admin.col.health": "Stare",
  "admin.col.lastRun": "Ultima rulare",
  "admin.col.actions": "Acțiuni",
  "admin.placeChosen": "Loc ales",
  "admin.newVenue": "Loc nou: {name}",
  "admin.close": "Închide",
  "admin.issues": "Nu a putut fi citit: {issues}",
  "admin.cancelled": "Sursa spune că evenimentul e anulat. Acceptarea îl închide.",
  "admin.venue": "Locație",
  "admin.address": "Adresă",
  "admin.price": "Preț",
  "admin.listing": "Anunțul",
  "admin.where": "Unde",
  "admin.geocoded": "Găsit după adresă",
  "admin.noLocation": "Nicio poziție încă. Alege un loc sau pune un pin.",
  "admin.pinHint": "Clic pe hartă pune un pin manual.",
  "admin.score": "potrivire {score}%",
  "admin.chosen": "Ales",
  "admin.useThisPlace": "Folosește locul",
  "admin.useThisPlaceNamed": "Folosește locul {name}",
  "admin.useThisPin": "Folosește pinul",
  "admin.accept": "Acceptă",
  "admin.acceptChange": "Acceptă modificarea",
  "admin.reject": "Respinge",
  "admin.needsPlace": "Alege întâi un loc.",
  "admin.sourcesLead": "Ce citește fiecare sursă și cum a mers ultima rulare.",
  "admin.refreshAll": "Actualizează tot",
  "admin.refresh": "Actualizează",
  "admin.refreshOne": "Actualizează {name}",
  "admin.refreshSummary": "{name}: {fetched} citite, {fresh} noi, {changed} modificate, {duplicates} duplicate, {attention} neclare, {stale} dispărute.",
  "admin.refreshFailed": "{name}: eroare ({error}).",
  "admin.noSources": "Nicio sursă încă",
  "admin.noSourcesBody": "Adaugă un flux iCal verificat mai jos.",
  "admin.health.never": "Nerulată",
  "admin.health.ok": "OK",
  "admin.health.suspect": "Suspectă",
  "admin.health.error": "Eroare",
  "admin.lastCount": "{n} evenimente data trecută",
  "admin.lastSuccess": "ultima reușită {when}",
  "admin.enabled": "Activă",
  "admin.addSource": "Adaugă o sursă",
  "admin.addSourceHint": "Un flux iCal public, după ce i-ai citit condițiile de utilizare.",
  "admin.field.name": "Nume",
  "admin.field.slug": "Identificator (litere mici și cratime)",
  "admin.field.url": "Adresa fluxului (.ics)",
  "admin.field.city": "Oraș",
  "admin.add": "Adaugă",
  "admin.osmTitle": "Locuri din OpenStreetMap",
  "admin.osmLead": "Reîncarcă locurile publice ale unui oraș. Locurile vin direct, fără revizuire.",
  "admin.osmSync": "Sincronizează {city}",
  "admin.osmResult": "{city}: {upserted} locuri actualizate, dintre care {inserted} noi.",
  "about.title": "Despre date",
  "about.lead": "De unde vin locurile și evenimentele de pe hartă, sub ce licențe le folosim și cum ne poate cere o sursă să o scoatem.",
  "about.placesTitle": "Locurile",
  "about.places": "Parcurile, bibliotecile, muzeele și instituțiile publice vin din OpenStreetMap, o hartă făcută de voluntari și publicată sub Open Database License (ODbL). Le sincronizăm periodic, așa că o corectură făcută în OpenStreetMap ajunge și aici.",
  "about.mapTitle": "Harta",
  "about.mapCarto": "Imaginile hărții sunt de la CARTO, desenate din datele OpenStreetMap.",
  "about.mapOsm": "Imaginile hărții sunt servite de OpenStreetMap, din aceleași date.",
  "about.eventsTitle": "Evenimentele",
  "about.events": "Evenimentele vin doar de la publicatori publici primari: calendare municipale sau finanțate public și locurile însele. Fiecare e verificat de un om înainte să apară, își numește sursa și duce la anunțul original.",
  "about.eventsSample": "Deocamdată, importul de evenimente e încă în lucru: evenimentele afișate acum sunt exemple create pentru testarea aplicației, nu anunțuri reale.",
  "about.notTitle": "Ce nu facem",
  "about.notTickets": "Nu vindem bilete. Când sursa dă un link de bilete, îl afișăm și te trimitem acolo; altfel scrie „Fără link de bilete”.",
  "about.notAggregators": "Nu preluăm evenimente de la agregatoare comerciale ale căror condiții interzic reutilizarea.",
  "about.iabilet": "O integrare de probă cu iaBilet poate exista în versiunile de dezvoltare. Așteaptă permisiunea lor și e oprită în producție.",
  "about.removeTitle": "Scoaterea unei surse",
  "about.remove": "Dacă publici evenimente pe care le preluăm și nu vrei să apară aici, scrie-ne și le scoatem, fără întrebări.",
  "about.removeNoContact": "Adresa de contact pentru cereri de eliminare e în curs de stabilire.",
  "event.at": "la",
  "event.until": "până pe {date}",

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
  "filters.remove": "Remove the {filter} filter",
  "state.widenArea": "Without the drawn area: {places}.",
  "state.widenSearch": "Without the search: {places}.",
  "lens.bannerToday": "Only places with events today: {places}",
  "lens.bannerWeekend": "Only places with events this weekend: {places}",
  "lens.showAll": "Show all",
  "map.attribution": "Map sources",
  "filters.more": "+{n}",
  "filters.showLess": "Fewer",
  "area.draw": "Draw an area",
  "area.tool": "How to draw",
  "area.freehand": "Freehand",
  "area.polygon": "Polygon",
  "area.hintFreehand": "Circle the area: press and drag.",
  "area.hintPolygon": "Tap the map to place corners, then Done.",
  "area.undo": "Undo",
  "area.done": "Done",
  "area.cancel": "Cancel",
  "area.redraw": "Redraw",
  "area.chip": "Drawn area",
  "area.remove": "Remove the drawn area",
  "area.zeroTitle": "No place inside the drawn area",
  "area.cleared": "Your drawn area was cleared: it belonged to another city.",
  "count.inArea_one": "{n} place in this area",
  "count.inArea_other": "{n} places in this area",

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
  "event.source": "Source:",
  "nav.aboutData": "About the data",
  "nav.archive": "Archive",
  "archive.title": "Archive",
  "archive.subtitle": "What happened at public places, and where.",
  "archive.mine": "My past events",
  "archive.city": "All of {city}",
  "archive.mineSignIn": "Sign in to see your history",
  "archive.mineSignInBody": "Events you saved, and those at places you follow, show up here once they are over.",
  "archive.mineEmpty": "Nothing in your history yet",
  "archive.mineEmptyBody": "Save events or follow places: once they are over, they show up here.",
  "archive.cityEmpty": "No past events recorded in {city} yet",
  "archive.cityEmptyBody": "Events show up here once they have ended.",
  "archive.more": "Show more",
  "archive.link": "Past events",
  "fav.place.add": "Follow {name}",
  "fav.place.remove": "Unfollow {name}",
  "fav.event.add": "Remind me of {name}",
  "fav.event.remove": "No reminder for {name}",
  "fav.place.why": "Follow the places you like",
  "fav.event.why": "Get a reminder the day before",
  "fav.signInBody": "Sign in to hear when new events appear, and to get reminders.",
  "bell.label": "Notifications",
  "bell.labelUnread": "Notifications, {n} unread",
  "bell.empty": "Nothing new yet.",
  "bell.newEvents_one": "{n} new event at {place}",
  "bell.newEvents_other": "{n} new events at {place}",
  "bell.reminder": "Tomorrow: {title}, at {place}",
  "admin.title": "Admin",
  "admin.review": "Review queue",
  "admin.sources": "Sources",
  "admin.exit": "Back to the site",
  "admin.signedInAs": "Signed in as {name}",
  "admin.signInTitle": "Sign in as an admin",
  "admin.signInBody": "The admin area is for accounts with CivicMap's admin grant.",
  "admin.forbiddenTitle": "You don't have access here",
  "admin.forbiddenBody": "Your account doesn't hold CivicMap's admin grant.",
  "admin.reviewLead": "Ingested events wait here. Nothing reaches the map until it's accepted.",
  "admin.buckets": "Review buckets",
  "admin.bucket.all": "All",
  "admin.bucket.quarantine": "Unreadable",
  "admin.bucket.attention": "No place",
  "admin.bucket.ambiguous": "Unsure place",
  "admin.bucket.changed": "Changed",
  "admin.bucket.venue": "New venue",
  "admin.bucket.ready": "Ready",
  "admin.selected": "{n} selected",
  "admin.selectAll": "Select everything shown",
  "admin.select": "Select “{title}”",
  "admin.acceptSelected": "Accept selected",
  "admin.rejectSelected": "Reject selected",
  "admin.accepted": "Accepted: {accepted}.",
  "admin.acceptedSkipped": "Accepted: {accepted}. {skipped} still need a place.",
  "admin.rejected": "Rejected: {n}.",
  "admin.emptyTitle": "Nothing to review",
  "admin.emptyBody": "Run a refresh from Sources.",
  "admin.col.event": "Event",
  "admin.col.when": "When",
  "admin.col.place": "Place",
  "admin.col.state": "State",
  "admin.col.source": "Source",
  "admin.col.health": "Health",
  "admin.col.lastRun": "Last run",
  "admin.col.actions": "Actions",
  "admin.placeChosen": "Place chosen",
  "admin.newVenue": "New venue: {name}",
  "admin.close": "Close",
  "admin.issues": "Could not be read: {issues}",
  "admin.cancelled": "The source says this event is cancelled. Accepting ends it.",
  "admin.venue": "Venue",
  "admin.address": "Address",
  "admin.price": "Price",
  "admin.listing": "Listing",
  "admin.where": "Where",
  "admin.geocoded": "Found by address",
  "admin.noLocation": "No position yet. Pick a place or drop a pin.",
  "admin.pinHint": "Click the map to drop a manual pin.",
  "admin.score": "{score}% match",
  "admin.chosen": "Chosen",
  "admin.useThisPlace": "Use this place",
  "admin.useThisPlaceNamed": "Use {name}",
  "admin.useThisPin": "Use this pin",
  "admin.accept": "Accept",
  "admin.acceptChange": "Accept the change",
  "admin.reject": "Reject",
  "admin.needsPlace": "Pick a place first.",
  "admin.sourcesLead": "What each source reads, and how its last run went.",
  "admin.refreshAll": "Refresh all",
  "admin.refresh": "Refresh",
  "admin.refreshOne": "Refresh {name}",
  "admin.refreshSummary": "{name}: {fetched} read, {fresh} new, {changed} changed, {duplicates} duplicates, {attention} unreadable, {stale} gone.",
  "admin.refreshFailed": "{name}: failed ({error}).",
  "admin.noSources": "No sources yet",
  "admin.noSourcesBody": "Add a vetted iCal feed below.",
  "admin.health.never": "Never run",
  "admin.health.ok": "OK",
  "admin.health.suspect": "Suspect",
  "admin.health.error": "Error",
  "admin.lastCount": "{n} events last time",
  "admin.lastSuccess": "last success {when}",
  "admin.enabled": "Enabled",
  "admin.addSource": "Add a source",
  "admin.addSourceHint": "A public iCal feed, once you have read its terms of use.",
  "admin.field.name": "Name",
  "admin.field.slug": "Key (lowercase and hyphens)",
  "admin.field.url": "Feed address (.ics)",
  "admin.field.city": "City",
  "admin.add": "Add",
  "admin.osmTitle": "Places from OpenStreetMap",
  "admin.osmLead": "Reload a city's public places. Places go straight in, with no review.",
  "admin.osmSync": "Sync {city}",
  "admin.osmResult": "{city}: {upserted} places updated, {inserted} of them new.",
  "about.title": "About the data",
  "about.lead": "Where the places and events on the map come from, the licences we use them under, and how a source can ask to be removed.",
  "about.placesTitle": "Places",
  "about.places": "Parks, libraries, museums and public institutions come from OpenStreetMap, a map made by volunteers and published under the Open Database License (ODbL). We sync them periodically, so a correction made in OpenStreetMap reaches this map too.",
  "about.mapTitle": "The map",
  "about.mapCarto": "Map tiles are by CARTO, drawn from OpenStreetMap data.",
  "about.mapOsm": "Map tiles are served by OpenStreetMap, from the same data.",
  "about.eventsTitle": "Events",
  "about.events": "Events come only from public primary publishers: municipal or publicly funded calendars and the venues themselves. Each is checked by a person before it appears, names its source and links to the original listing.",
  "about.eventsSample": "For now the event import is still being built: the events shown are samples made to test the app, not real listings.",
  "about.notTitle": "What we don't do",
  "about.notTickets": "We don't sell tickets. When a source gives a ticket link we show it and send you there; otherwise the event says “No ticket link”.",
  "about.notAggregators": "We don't take events from commercial aggregators whose terms forbid reuse.",
  "about.iabilet": "A proof-of-concept iaBilet integration may exist in development builds. It awaits their permission and is disabled in production.",
  "about.removeTitle": "Removing a source",
  "about.remove": "If you publish events we pick up and don't want them here, write to us and we take them down, no questions asked.",
  "about.removeNoContact": "The contact address for removal requests is still being set up.",
  "event.at": "at",
  "event.until": "until {date}",

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
