import { api, pickKey, unwrap } from "@/lib/api/client";
import type { ApiResponse } from "@/types/api";
import type { ChartPayload, StatusStat } from "@/types/dashboard";

const pick = pickKey;

/** Default dashboard cards — mirrors the reference SRIBEES Express client dashboard. */
export const DEFAULT_DASHBOARD_STATUSES = [
  "key_1", // Processing
  "key_4", // Dispatched to Destination
  "key_3", // Collected from Warehouse
  "key_5", // Received at Destination
  "key_6", // Out for Delivery
];

/** GET /api/v1/client-dashboard/status-statistic?statuses[]=... */
export async function getStatusStatistics(
  statuses: string[] = DEFAULT_DASHBOARD_STATUSES
): Promise<StatusStat[]> {
  const res = await api.get<ApiResponse<unknown>>(
    "/v1/client-dashboard/status-statistic",
    { params: { statuses } }
  );
  const statusData = pick<unknown[]>(unwrap(res), "status_data") ?? [];

  // Each item is keyed by the status key: { key_8: { name, order_count, ... } }.
  return statusData.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    return Object.entries(item as Record<string, Omit<StatusStat, "key">>).map(
      ([key, v]) => ({ key, ...v })
    );
  });
}

/** GET /api/v1/client-dashboard/orders-chart → monthly order volume. */
export async function getOrdersChart(): Promise<ChartPayload | null> {
  const res = await api.get<ApiResponse<unknown>>(
    "/v1/client-dashboard/orders-chart"
  );
  return pick<ChartPayload>(unwrap(res), "monthly_order_chart") ?? null;
}
