import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getOperationDashboardKpi,
  getOperationDashboardStatus,
  refreshOperationDashboardStatus,
} from "@/lib/api/admin-dashboard";

export function useOperationDashboardStatus() {
  return useQuery({
    queryKey: ["admin-dashboard-status"],
    queryFn: getOperationDashboardStatus,
    staleTime: 60 * 1000,
  });
}

export function useOperationDashboardKpi() {
  return useQuery({
    queryKey: ["admin-dashboard-kpi"],
    queryFn: getOperationDashboardKpi,
    staleTime: 60 * 1000,
  });
}

export function useRefreshOperationDashboardStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: refreshOperationDashboardStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-status"] });
    },
  });
}
