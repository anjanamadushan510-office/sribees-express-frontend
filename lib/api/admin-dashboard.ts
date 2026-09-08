import { api, pickKey, unwrap } from "@/lib/api/client";
import type { ApiResponse } from "@/types/api";
import type {
  DashboardKpiEntry,
  OperationDashboardStatus,
  OperationStatusCount,
} from "@/types/admin-dashboard";

/** GET /api/v1/dashboard/operation-dashboard-status — staff-wide status counts. */
export async function getOperationDashboardStatus(): Promise<OperationDashboardStatus> {
  const res = await api.get<ApiResponse<unknown>>(
    "/v1/dashboard/operation-dashboard-status"
  );
  const data = unwrap(res);
  return {
    status_data: pickKey<OperationStatusCount[]>(data, "status_data") ?? [],
    last_update_at: pickKey(data, "last_update_at") ?? null,
  };
}

/**
 * GET /api/v1/dashboard/operation-dashboard-kpi — a Redis-cached snapshot with
 * no fixed schema; normalised into a flat key/value list either way (the
 * envelope helper flattens single-object payloads into `[{key,value}]`).
 */
export async function getOperationDashboardKpi(): Promise<DashboardKpiEntry[]> {
  const res = await api.get<ApiResponse<unknown>>("/v1/dashboard/operation-dashboard-kpi");
  const data = unwrap(res);
  if (Array.isArray(data)) return data as DashboardKpiEntry[];
  if (data && typeof data === "object") {
    return Object.entries(data as Record<string, unknown>).map(([key, value]) => ({
      key,
      value,
    }));
  }
  return [];
}

/** GET /api/v1/dashboard/operation-dashboard-status/refresh — recompute the cached figures. */
export async function refreshOperationDashboardStatus(): Promise<void> {
  await api.get("/v1/dashboard/operation-dashboard-status/refresh");
}
