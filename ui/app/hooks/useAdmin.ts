import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateSourceInput, ResolvePlaceInput } from "@public-resource-map/shared";
import { adminApi } from "~/lib/adminApi";

/** Admin data (brief 16). Every write refreshes what it could have changed. */

export function useSources() {
  return useQuery({ queryKey: ["admin", "sources"], queryFn: adminApi.sources });
}

export function useStaged() {
  return useQuery({ queryKey: ["admin", "staged"], queryFn: adminApi.staged });
}

function useInvalidate() {
  const client = useQueryClient();
  return () => {
    void client.invalidateQueries({ queryKey: ["admin"] });
    // Accepting publishes: the public map and what's on must refetch too.
    void client.invalidateQueries({ queryKey: ["places"] });
    void client.invalidateQueries({ queryKey: ["whats-on"] });
    void client.invalidateQueries({ queryKey: ["place-events"] });
  };
}

export function useRefreshSource() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: adminApi.refresh, onSettled: invalidate });
}

export function useRefreshAll() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: adminApi.refreshAll, onSettled: invalidate });
}

export function useSetSourceEnabled() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => adminApi.setSourceEnabled(id, enabled),
    onSettled: invalidate,
  });
}

export function useCreateSource() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (input: CreateSourceInput) => adminApi.createSource(input), onSettled: invalidate });
}

export function useAccept() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: adminApi.accept, onSettled: invalidate });
}

export function useReject() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: adminApi.reject, onSettled: invalidate });
}

export function useResolvePlace() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ResolvePlaceInput }) => adminApi.resolvePlace(id, input),
    onSettled: invalidate,
  });
}

export function useOsmSync() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: adminApi.osmSync, onSettled: invalidate });
}
