import { create } from "zustand";
import type { Place, PlaceCategory } from "@public-resource-map/shared";

interface MapFilterState {
  radius: number;
  category: PlaceCategory | undefined;
  search: string;
  selected: Place | null;
  setRadius: (radius: number) => void;
  toggleCategory: (category: PlaceCategory) => void;
  setSearch: (search: string) => void;
  setSelected: (selected: Place | null) => void;
}

export const useMapFilterStore = create<MapFilterState>((set) => ({
  radius: 5,
  category: undefined,
  search: "",
  selected: null,
  setRadius: (radius) => set({ radius }),
  toggleCategory: (category) =>
    set((state) => ({ category: state.category === category ? undefined : category })),
  setSearch: (search) => set({ search }),
  setSelected: (selected) => set({ selected }),
}));
