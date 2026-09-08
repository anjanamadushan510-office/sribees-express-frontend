/** One entry of GET /v1/dashboard/operation-dashboard-status → data.status_data. */
export interface OperationStatusCount {
  KeyName: string;
  NAME: string;
  count: number;
}

export interface OperationDashboardStatus {
  status_data: OperationStatusCount[];
  /** Redis-cached timestamp string (shape varies with how the cron last wrote it). */
  last_update_at: unknown;
}

/**
 * GET /v1/dashboard/operation-dashboard-kpi is a thin passthrough of whatever
 * a background job last cached in Redis (`staff-orders-kpi-dashboard-figures`).
 * There's no fixed schema on the backend, so we render it as a generic list
 * of key/value pairs rather than guessing field names.
 */
export interface DashboardKpiEntry {
  key: string;
  value: unknown;
}
