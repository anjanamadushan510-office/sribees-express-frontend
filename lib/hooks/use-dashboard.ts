import { useQueries, useQuery } from "@tanstack/react-query";
import {
  getDashboardSummary,
  getOrderStatusCatalogue,
  orderedStatusCounts,
} from "@/lib/api/dashboard";

const CATALOGUE_STALE_MS = 60 * 60 * 1000; // the status catalogue barely changes

/**
 * Milestone counts for the dashboard cards.
 *
 * Two requests, combined here: the summary supplies the numbers and the
 * catalogue supplies the labels and validates the keys. Labelling from the
 * catalogue rather than from a local map is what stops a status renamed in the
 * backend from showing its old name in the UI indefinitely.
 */
export function useStatusStatistics() {
  return useQueries({
    queries: [
      { queryKey: ["dashboard-summary"], queryFn: getDashboardSummary },
      {
        queryKey: ["order-status-catalogue"],
        queryFn: getOrderStatusCatalogue,
        staleTime: CATALOGUE_STALE_MS,
      },
    ],
    combine: ([summary, catalogue]) => ({
      data:
        summary.data && catalogue.data
          ? orderedStatusCounts(summary.data, catalogue.data)
          : undefined,
      isLoading: summary.isLoading || catalogue.isLoading,
      isError: summary.isError || catalogue.isError,
    }),
  });
}

/** Total order count, sharing the summary request with the cards above. */
export function useDashboardTotals() {
  return useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: getDashboardSummary,
    select: (summary) => summary.total_orders,
  });
}
