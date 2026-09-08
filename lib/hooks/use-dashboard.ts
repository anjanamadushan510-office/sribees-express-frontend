import { useQuery } from "@tanstack/react-query";
import { getOrdersChart, getStatusStatistics } from "@/lib/api/dashboard";

export function useStatusStatistics(statuses?: string[]) {
  return useQuery({
    queryKey: ["dashboard-status-stats", statuses],
    queryFn: () => getStatusStatistics(statuses),
  });
}

export function useOrdersChart() {
  return useQuery({
    queryKey: ["dashboard-orders-chart"],
    queryFn: getOrdersChart,
  });
}
