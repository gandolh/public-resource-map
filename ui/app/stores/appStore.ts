import { create } from "zustand";
import type { EventLens, PlaceCategory } from "@public-resource-map/shared";
import { CITIES, DEFAULT_CITY, cityById, type City } from "~/lib/cities";
import { LocalStorage } from "~/lib/LocalStorage";

const CITY_KEY = "civicmap-city";

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

  setCity: (city: City) => void;
  hydrateCity: () => void;
  toggleCategory: (category: PlaceCategory) => void;
  clearCategories: () => void;
  setLens: (lens: EventLens) => void;
  setSearch: (search: string) => void;
  select: (id: string | null) => void;
  setSheetSnap: (snap: "peek" | "full" | null) => void;
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

  setCity: (city) => {
    LocalStorage.set(CITY_KEY, city.id);
    // A drawn area or a selection from the previous city is meaningless here.
    set({ city, selectedId: null, search: "" });
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

  hasFilters: () => {
    const s = get();
    return s.categories.length > 0 || s.lens !== "all" || s.search.trim() !== "";
  },

  clearFilters: () => set({ categories: [], lens: "all", search: "" }),
}));
