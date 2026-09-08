import { api, pickKey, unwrap } from "@/lib/api/client";
import type { ApiResponse } from "@/types/api";
import type { RegionalStatusesCount } from "@/types/admin-area-manager";

/** GET /api/v1/collective-dashboard/statuses-count — status totals across the area manager's branches. */
export async function getRegionalStatusesCount(): Promise<RegionalStatusesCount> {
  const res = await api.get<ApiResponse<unknown>>("/v1/collective-dashboard/statuses-count");
  const data = unwrap(res);
  return {
    statusCount: pickKey(data, "statusCount") ?? [],
    last_update_at: pickKey<string>(data, "last_update_at") ?? "",
  };
}

/** POST /api/v1/collective-dashboard/refresh. */
export async function refreshRegionalDashboard(): Promise<void> {
  await api.post("/v1/collective-dashboard/refresh");
}
