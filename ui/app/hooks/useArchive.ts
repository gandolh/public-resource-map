import { useInfiniteQuery } from "@tanstack/react-query";
import type { PaginatedResponse, WhatsOnItem } from "@public-resource-map/shared";
import { fetchArchive } from "~/lib/api";
import { meApi } from "~/lib/meApi";

/** Archives grow: loaded a page at a time, newest first (brief 14). */
const nextPage = (last: PaginatedResponse<WhatsOnItem>) =>
  last.page * last.pageSize < last.total ? last.page + 1 : undefined;

export function useCityArchive(city: string, categories: string[], enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ["archive", "city", city, [...categories].sort().join(",")],
    queryFn: ({ pageParam, signal }) => fetchArchive({ city, categories, page: pageParam }, signal),
    initialPageParam: 1,
    getNextPageParam: nextPage,
    enabled,
  });
}

export function useMyArchive(categories: string[], enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ["archive", "mine", [...categories].sort().join(",")],
    queryFn: ({ pageParam }) => meApi.myArchive(categories, pageParam),
    initialPageParam: 1,
    getNextPageParam: nextPage,
    enabled,
  });
}
