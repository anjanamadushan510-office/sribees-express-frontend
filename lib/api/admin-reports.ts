import { api } from "@/lib/api/client";
import type {
  GenerateReportPayload,
  ReportApiEnvelope,
  ReportDashboardSummary,
  ReportHistoryDetail,
  ReportHistoryListParams,
  ReportHistoryRow,
  ReportTypeOption,
} from "@/types/admin-report";
import type { Pagination } from "@/types/api";

/** GET /v1/report-history — paginated, filterable report-generation history. */
export async function listReportHistory(
  params: ReportHistoryListParams
): Promise<{ items: ReportHistoryRow[]; pagination: Pagination }> {
  const res = await api.get<ReportApiEnvelope<ReportHistoryRow[]>>("/v1/report-history", {
    params: clean(params),
  });
  return {
    items: res.data.data ?? [],
    pagination: res.data.pagination ?? {
      total: 0,
      per_page: params.per_page ?? 15,
      current_page: 1,
      last_page: 1,
    },
  };
}

/** GET /v1/report-history/dashboard-summary. */
export async function getReportDashboardSummary(): Promise<ReportDashboardSummary> {
  const res = await api.get<ReportApiEnvelope<ReportDashboardSummary>>(
    "/v1/report-history/dashboard-summary"
  );
  return res.data.data;
}

/**
 * GET /v1/queued-reports/types (and /v1/report-history/types, which returns the identical
 * `ReportType::getTypesWithDescriptions()` shape — both controllers share the same enum
 * method, so one fetcher covers both routes).
 */
export async function getReportTypes(): Promise<ReportTypeOption[]> {
  const res = await api.get<ReportApiEnvelope<ReportTypeOption[]>>("/v1/queued-reports/types");
  return res.data.data ?? [];
}

/** GET /v1/report-history/{id}. */
export async function getReportHistoryDetail(
  id: number | string
): Promise<ReportHistoryDetail> {
  const res = await api.get<ReportApiEnvelope<ReportHistoryDetail>>(`/v1/report-history/${id}`);
  return res.data.data;
}

/** POST /v1/report-history/{id}/rerun. */
export async function rerunReport(id: number | string): Promise<void> {
  await api.post<ReportApiEnvelope<unknown>>(`/v1/report-history/${id}/rerun`);
}

/** POST /v1/queued-reports/{type}/generate — kick off a new report generation job. */
export async function generateReport(
  type: string,
  payload: GenerateReportPayload
): Promise<void> {
  await api.post<ReportApiEnvelope<unknown>>(`/v1/queued-reports/${type}/generate`, payload);
}

/**
 * GET /v1/report-history/{id}/download-excel — a real file download (Laravel Excel
 * response), not JSON. Fetched as a blob (the bearer token can't ride along on a plain
 * `<a href>`/`window.open` navigation) and saved client-side.
 */
export async function downloadReportExcel(
  id: number | string,
  filenameHint: string
): Promise<void> {
  const res = await api.get(`/v1/report-history/${id}/download-excel`, {
    responseType: "blob",
  });
  const blob = new Blob([res.data], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filenameHint}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function clean<T extends object>(params: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    out[k] = v;
  }
  return out;
}
