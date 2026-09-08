import { useQuery } from "@tanstack/react-query";
import { getDashboardSummary, orderedStatusCounts } from "@/lib/api/dashboard";

/** Status counts for the dashboard cards, in a fixed display order. */
export function useStatusStatistics() {
  return useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: getDashboardSummary,
    select: orderedStatusCounts,
  });
}

/** Total order count, from the same single request as the cards. */
export function useDashboardTotals() {
  return useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: getDashboardSummary,
    select: (summary) => summary.total_orders,
  });
}
