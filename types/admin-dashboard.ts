import type { StatusCount } from "@/types/dashboard";

/** GET /analytics/dashboard/status-counts — the whole operation, not one client. */
export interface AdminDashboardCounts {
  total_orders: number;
  by_status: StatusCount[];
}
