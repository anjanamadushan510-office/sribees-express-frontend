import { useQueries, useQueryClient, useMutation } from "@tanstack/react-query";
import { getAdminDashboardCounts, tryGetStatusCatalogue } from "@/lib/api/admin-dashboard";
import type { StatusCount } from "@/types/dashboard";

const DASHBOARD_STALE_MS = 60 * 1000;

/**
 * Operation-wide status counts.
 *
 * The catalogue is fetched alongside only to *order* the rows — it is
 * client-authenticated and returns null for a staff token, in which case the
 * counts still render in whatever order the API sent them. Ordering is a
 * nicety; the numbers are the point.
 */
export function useOperationDashboardStatus() {
  return useQueries({
    queries: [
      {
        queryKey: ["admin-dashboard-counts"],
        queryFn: getAdminDashboardCounts,
        staleTime: DASHBOARD_STALE_MS,
      },
      {
        queryKey: ["order-status-catalogue-staff"],
        queryFn: tryGetStatusCatalogue,
        staleTime: 60 * 60 * 1000,
      },
    ],
    combine: ([counts, catalogue]) => ({
      data: counts.data
        ? {
            total_orders: counts.data.total_orders,
            by_status: orderByCatalogue(counts.data.by_status, catalogue.data ?? null),
          }
        : undefined,
      isLoading: counts.isLoading,
      isError: counts.isError,
    }),
  });
}

/** Refetch on demand — there is no server-side "refresh" to trigger. */
export function useRefreshOperationDashboardStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-dashboard-counts"] });
    },
  });
}

function orderByCatalogue(
  rows: StatusCount[],
  catalogue: { key: string }[] | null
): StatusCount[] {
  if (!catalogue) return rows;
  const rank = new Map(catalogue.map((s, i) => [s.key, i]));
  return [...rows].sort(
    (a, b) =>
      (rank.get(a.status_key) ?? Number.MAX_SAFE_INTEGER) -
      (rank.get(b.status_key) ?? Number.MAX_SAFE_INTEGER)
  );
}
