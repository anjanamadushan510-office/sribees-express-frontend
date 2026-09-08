/**
 * The Reports module's `ReportHistoryController` / `QueuedReportsController` respond via
 * plain `response()->json([...])`, bypassing `APIHelper::makeAPIResponse` entirely — a
 * completely different envelope from the rest of the app: `{ success, data, message?,
 * pagination? }` instead of `{ status_code, timestamp, message, data, error, pagination,
 * metadata }`. No `convertToAPIData` reshape applies here, so `data` is used as-is (no
 * `pickKey` needed) — see `lib/api/admin-reports.ts`.
 */
export interface ReportApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export type ReportStatus = "pending" | "processing" | "completed" | "failed";

export interface ReportTypeOption {
  type: string;
  name: string;
  description: string;
}

/** A row from GET /v1/report-history (ReportHistoryAction::getFilteredHistory). */
export interface ReportHistoryRow {
  id: number;
  report_type: string;
  report_type_label: string;
  filters: Record<string, unknown> | null;
  status: ReportStatus;
  status_label: string;
  created_at: string;
  completed_at: string | null;
  staff_id: number | null;
  error_message: string | null;
  row_count: number | null;
  is_in_progress: boolean;
  is_final: boolean;
}

export interface ReportHistoryListParams {
  page?: number;
  per_page?: number;
  report_type?: string;
  status?: ReportStatus;
  date_from?: string;
  date_to?: string;
  search?: string;
  order_by?: "report_type" | "status" | "created_at" | "completed_at";
  order_by_direction?: "asc" | "desc";
}

export interface ReportDashboardSummary {
  total_reports: number;
  status_counts: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
  type_counts: {
    branch_manifest: number;
    diff_dest_manifest: number;
    branch_progress: number;
  };
  most_frequent_type: { type: string; count: number; label: string } | null;
  recent_activity: number;
}

/** GET /v1/report-history/{id} → data. */
export interface ReportHistoryDetail extends ReportHistoryRow {
  status_color: string;
  result_data: unknown;
  file_path: string | null;
  updated_at: string;
}

/** Payload for POST /v1/queued-reports/{type}/generate (QueuedReportFilterDTO subset). */
export interface GenerateReportPayload {
  date_range?: string;
  branch_id?: number;
  client_id?: number;
  current_rider_id?: number;
}
