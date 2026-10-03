import { create } from "zustand";
import type { EventLens, PlaceCategory } from "@public-resource-map/shared";
import { CITIES, DEFAULT_CITY, cityById, type City } from "~/lib/cities";
import { LocalStorage } from "~/lib/LocalStorage";
import type { AreaRing } from "~/lib/area";

const CITY_KEY = "civicmap-city";

/** The two ways to draw an area (brief 15). */
export type DrawMode = "freehand" | "polygon";

/** One-off messages the shell shows once and lets go of. */
export type Notice = "areaCleared";

/**
 * City and filters live in one store on purpose: the map and the what's-on
 * index are two lenses on the same query, and the locked decision is that they
 * always agree. Two stores would eventually let them drift.
 */
interface AppState {
  city: City;
  categories: PlaceCategory[];
  lens: EventLens;
  search: string;
  /** Which place the panel/sheet is showing; the map owns the selection. */
  selectedId: string | null;
  /**
   * Which snap the mobile sheet is resting at, or null when no sheet is up.
   * The map reads this to keep the tile attribution above the sheet — tiles may
   * never render unattributed, at either snap.
   */
  sheetSnap: "peek" | "full" | null;
  /**
   * The drawn area (brief 15), ANDed with every other filter on the map and on
   * what's-on. Ephemeral on purpose: not persisted, and cleared when the city
   * changes, since a Timișoara shape means nothing in București.
   */
  area: AreaRing | null;
  /** The draw tool while it is active. The map locks pan and zoom meanwhile. */
  drawMode: DrawMode | null;
  notice: Notice | null;

  setCity: (city: City) => void;
  /**
   * Switch to the city a deep-linked place is in, keeping the selection and
   * search that `setCity` clears. Persisted like `setCity`, which is also what
   * keeps `hydrateCity` from undoing it: hydration reads back this city.
   */
  adoptCity: (city: City) => void;
  hydrateCity: () => void;
  toggleCategory: (category: PlaceCategory) => void;
  clearCategories: () => void;
  setLens: (lens: EventLens) => void;
  setSearch: (search: string) => void;
  select: (id: string | null) => void;
  setSheetSnap: (snap: "peek" | "full" | null) => void;
  setArea: (area: AreaRing) => void;
  clearArea: () => void;
  setDrawMode: (mode: DrawMode | null) => void;
  dismissNotice: () => void;
  /** True when anything is narrowing the result set. */
  hasFilters: () => boolean;
  clearFilters: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Always start on the default so the first client render matches any
  // prerendered markup; `hydrateCity` settles to the stored choice after mount.
  city: DEFAULT_CITY,
  categories: [],
  lens: "all",
  search: "",
  selectedId: null,
  sheetSnap: null,
  area: null,
  drawMode: null,
  notice: null,

  setCity: (city) => {
    LocalStorage.set(CITY_KEY, city.id);
    // A drawn area or a selection from the previous city is meaningless here.
    set({ city, selectedId: null, search: "", ...leaveArea(get(), city) });
  },

  adoptCity: (city) => {
    LocalStorage.set(CITY_KEY, city.id);
    set({ city, ...leaveArea(get(), city) });
  },

  hydrateCity: () => {
    const stored = LocalStorage.get<string>(CITY_KEY);
    if (stored && CITIES.some((c) => c.id === stored)) {
      set({ city: cityById(stored) });
    }
  },

  toggleCategory: (category) =>
    set((state) => ({
      categories: state.categories.includes(category)
        ? state.categories.filter((c) => c !== category)
        : [...state.categories, category],
    })),

  clearCategories: () => set({ categories: [] }),
  setLens: (lens) => set({ lens }),
  setSearch: (search) => set({ search }),
  select: (selectedId) => set({ selectedId }),
  setSheetSnap: (sheetSnap) => set({ sheetSnap }),
  setArea: (area) => set({ area, drawMode: null }),
  clearArea: () => set({ area: null, drawMode: null }),
  setDrawMode: (drawMode) => set({ drawMode }),
  dismissNotice: () => set({ notice: null }),

  hasFilters: () => {
    const s = get();
    return (
      s.categories.length > 0 || s.lens !== "all" || s.search.trim() !== "" || s.area !== null
    );
  },

  clearFilters: () => set({ categories: [], lens: "all", search: "", area: null }),
}));

/**
 * What a move to `city` does to the drawn area: nothing when the city is the
 * same, otherwise the area (and any drawing in progress) goes, and the shell
 * says so rather than letting a filter vanish silently.
 */
function leaveArea(state: AppState, city: City): Partial<AppState> {
  if (state.city.id === city.id) return {};
  return {
    area: null,
    drawMode: null,
    notice: state.area ? "areaCleared" : state.notice,
  };
}
