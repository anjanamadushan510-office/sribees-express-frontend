import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getRegionalStatusesCount, refreshRegionalDashboard } from "@/lib/api/admin-area-manager";

export function useRegionalStatusesCount() {
  return useQuery({
    queryKey: ["admin-regional-statuses-count"],
    queryFn: getRegionalStatusesCount,
    staleTime: 60 * 1000,
  });
}

export function useRefreshRegionalDashboard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: refreshRegionalDashboard,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-regional-statuses-count"] }),
  });
}
