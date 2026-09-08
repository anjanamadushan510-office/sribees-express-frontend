import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  downloadReportExcel,
  generateReport,
  getReportDashboardSummary,
  getReportHistoryDetail,
  getReportTypes,
  listReportHistory,
  rerunReport,
} from "@/lib/api/admin-reports";
import type { GenerateReportPayload, ReportHistoryListParams } from "@/types/admin-report";

export function useReportHistory(params: ReportHistoryListParams) {
  return useQuery({
    queryKey: ["admin-report-history", params],
    queryFn: () => listReportHistory(params),
    placeholderData: keepPreviousData,
    // Reports can still be pending/processing — poll while any are in flight.
    refetchInterval: (query) =>
      query.state.data?.items.some((r) => r.is_in_progress) ? 5000 : false,
  });
}

export function useReportDashboardSummary() {
  return useQuery({
    queryKey: ["admin-report-dashboard-summary"],
    queryFn: getReportDashboardSummary,
    staleTime: 60 * 1000,
  });
}

export function useReportTypes() {
  return useQuery({
    queryKey: ["admin-report-types"],
    queryFn: getReportTypes,
    staleTime: 60 * 60 * 1000,
  });
}

export function useReportHistoryDetail(id: number | string | null) {
  return useQuery({
    queryKey: ["admin-report-history-detail", String(id)],
    queryFn: () => getReportHistoryDetail(id as number | string),
    enabled: id !== null,
    refetchInterval: (query) => (query.state.data?.is_in_progress ? 5000 : false),
  });
}

export function useGenerateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ type, payload }: { type: string; payload: GenerateReportPayload }) =>
      generateReport(type, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-report-history"] });
      queryClient.invalidateQueries({ queryKey: ["admin-report-dashboard-summary"] });
    },
  });
}

export function useRerunReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => rerunReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-report-history"] });
      queryClient.invalidateQueries({ queryKey: ["admin-report-dashboard-summary"] });
    },
  });
}

export function useDownloadReportExcel() {
  return useMutation({
    mutationFn: ({ id, filenameHint }: { id: number | string; filenameHint: string }) =>
      downloadReportExcel(id, filenameHint),
  });
}
