/** A single status statistic card (ClientDashboardStatusService::getFormatedStatusData). */
export interface StatusStat {
  key: string;
  name: string;
  color?: string | null;
  icon?: string | null;
  class?: string | null;
  order_count: number;
}

/** Chart.js-style payload returned by the dashboard chart endpoints. */
export interface ChartPayload {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    fill?: boolean;
  }[];
}
