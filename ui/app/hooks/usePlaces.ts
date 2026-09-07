import { useQuery } from "@tanstack/react-query";
import type { Event, EventLens, PaginatedResponse, Place, PlaceCategory, WhatsOnItem }
  from "@public-resource-map/shared";
import { fetchPlace, fetchPlaceEvents, fetchPlaces, fetchWhatsOn } from "~/lib/api";

/**
 * The city's places for the map. Keyed on city + category chips + lens so the
 * cache is reused when a user toggles back to a combination they have seen,
 * and `placeholderData` keeps the previous pins on screen while the next set
 * loads — the map never blinks empty mid-filter.
 */
export function usePlaces(input: {
  city: string;
  categories: PlaceCategory[];
  lens: EventLens;
}) {
  return useQuery<PaginatedResponse<Place>>({
    queryKey: ["places", input.city, [...input.categories].sort().join(","), input.lens],
    queryFn: ({ signal }) => fetchPlaces(input, signal),
    placeholderData: (prev) => prev,
  });
}

export function usePlace(id: string | null | undefined) {
  return useQuery<Place>({
    queryKey: ["place", id],
    queryFn: ({ signal }) => fetchPlace(id!, signal),
    enabled: Boolean(id),
  });
}

/**
 * A place's programme. Deliberately always fetched with the `all` lens: the
 * panel shows everything upcoming here and says which items fall in the active
 * lens itself, rather than hiding the rest and looking empty.
 */
export function usePlaceEvents(id: string | null | undefined) {
  return useQuery<PaginatedResponse<Event>>({
    queryKey: ["place-events", id],
    queryFn: ({ signal }) => fetchPlaceEvents(id!, "all", signal),
    enabled: Boolean(id),
  });
}

export function useWhatsOn(input: {
  city: string;
  categories: PlaceCategory[];
  lens: EventLens;
}) {
  return useQuery<PaginatedResponse<WhatsOnItem>>({
    queryKey: ["whats-on", input.city, [...input.categories].sort().join(","), input.lens],
    queryFn: ({ signal }) => fetchWhatsOn(input, signal),
    placeholderData: (prev) => prev,
  });
}
