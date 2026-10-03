import type {
  AcceptResultDto,
  CreateSourceInput,
  EventSourceDto,
  OsmSyncResult,
  RefreshSummary,
  ResolvePlaceInput,
  StagedEventDto,
} from "@public-resource-map/shared";
import { ApiRequestError } from "~/lib/api";

/**
 * The admin side of the API (briefs 04, 03, 16). Same origin as the public
 * calls, so Ward's cookie rides along; every route answers 401/403 to anyone
 * without `prm:admin`.
 */

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

async function send<T>(method: "GET" | "POST" | "PATCH", path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: "include",
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = (await res.json()) as { message?: string };
      if (data?.message) message = data.message;
    } catch {
      /* non-JSON error body: keep the status message */
    }
    throw new ApiRequestError(res.status, message);
  }
  return res.json() as Promise<T>;
}

export const adminApi = {
  sources: () => send<{ data: EventSourceDto[] }>("GET", "/api/admin/sources").then((r) => r.data),
  createSource: (input: CreateSourceInput) => send<EventSourceDto>("POST", "/api/admin/sources", input),
  setSourceEnabled: (id: string, enabled: boolean) =>
    send<EventSourceDto>("PATCH", `/api/admin/sources/${encodeURIComponent(id)}`, { enabled }),
  refresh: (id: string) =>
    send<RefreshSummary>("POST", `/api/admin/sources/${encodeURIComponent(id)}/refresh`),
  refreshAll: () =>
    send<{ data: (RefreshSummary | { sourceId: string; status: "error"; error: string })[] }>(
      "POST",
      "/api/admin/sources/refresh-all",
    ).then((r) => r.data),
  staged: () => send<{ data: StagedEventDto[] }>("GET", "/api/admin/staged-events").then((r) => r.data),
  accept: (ids: string[]) => send<AcceptResultDto>("POST", "/api/admin/staged-events/accept", { ids }),
  reject: (ids: string[]) => send<{ rejected: number }>("POST", "/api/admin/staged-events/reject", { ids }),
  resolvePlace: (id: string, input: ResolvePlaceInput) =>
    send<StagedEventDto>("POST", `/api/admin/staged-events/${encodeURIComponent(id)}/place`, input),
  osmSync: (city: string) => send<OsmSyncResult>("POST", "/api/admin/osm/sync", { city }),
};
