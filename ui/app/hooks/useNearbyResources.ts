import { useQuery } from "@tanstack/react-query";
import { fetchResources, type NearbyResourcesQuery } from "~/lib/api";

export function useNearbyResources(query: NearbyResourcesQuery) {
  const { data, isPending, error } = useQuery({
    queryKey: ["resources", query],
    queryFn: ({ signal }) => fetchResources(query, signal),
  });

  return {
    resources: data?.data ?? [],
    loading: isPending,
    error: error ? (error as Error).message : null,
  };
}
