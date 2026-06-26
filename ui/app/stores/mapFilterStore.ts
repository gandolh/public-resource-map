import { create } from "zustand";
import type { Resource, ResourceCategory } from "@public-resource-map/shared";

interface MapFilterState {
  radius: number;
  category: ResourceCategory | undefined;
  search: string;
  selected: Resource | null;
  setRadius: (radius: number) => void;
  toggleCategory: (category: ResourceCategory) => void;
  setSearch: (search: string) => void;
  setSelected: (selected: Resource | null) => void;
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
