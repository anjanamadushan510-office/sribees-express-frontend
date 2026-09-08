/** One row of `DashboardSummaryOut.by_status`. */
export interface StatusCount {
  status_key: string;
  status_name: string;
  count: number;
}

/** GET /client-portal/dashboard/summary */
export interface DashboardSummary {
  total_orders: number;
  by_status: StatusCount[];
}
