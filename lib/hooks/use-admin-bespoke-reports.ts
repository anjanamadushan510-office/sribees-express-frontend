import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSortingReport,
  deleteSortingReport,
  fetchBespokeReport,
  getClientCountDashboard,
  getPendingInvoiceDashboard,
  getSortingCenterBranchMap,
  getSortingReportView,
  markWaybillAudited,
} from "@/lib/api/admin-bespoke-reports";
import type { BespokeReportDef } from "@/types/admin-bespoke-report";

export function useBespokeReport(
  def: BespokeReportDef | undefined,
  filterValues: Record<string, string>,
  page: number,
  perPage: number,
  enabled: boolean
) {
  return useQuery({
    queryKey: ["admin-bespoke-report", def?.id, filterValues, page, perPage],
    queryFn: () => fetchBespokeReport(def!, filterValues, page, perPage),
    enabled: enabled && !!def,
    placeholderData: keepPreviousData,
  });
}

export function useMarkWaybillAudited() {
  return useMutation({
    mutationFn: (waybillId: string) => markWaybillAudited(waybillId),
  });
}

export function useClientCountDashboard() {
  return useQuery({
    queryKey: ["admin-client-count-dashboard"],
    queryFn: getClientCountDashboard,
  });
}

export function usePendingInvoiceDashboard() {
  return useQuery({
    queryKey: ["admin-pending-invoice-dashboard"],
    queryFn: getPendingInvoiceDashboard,
  });
}

export function useSortingCenterBranchMap() {
  return useQuery({
    queryKey: ["admin-sorting-center-branch-map"],
    queryFn: getSortingCenterBranchMap,
  });
}

export function useSortingReportView(id: number | string | null) {
  return useQuery({
    queryKey: ["admin-sorting-report-view", String(id)],
    queryFn: () => getSortingReportView(id as number | string),
    enabled: id !== null,
  });
}

export function useCreateSortingReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; details: string; branch_ids: number[] }) =>
      createSortingReport(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bespoke-report", "sorting-reports-list"] });
    },
  });
}

export function useDeleteSortingReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => deleteSortingReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bespoke-report", "sorting-reports-list"] });
    },
  });
}
