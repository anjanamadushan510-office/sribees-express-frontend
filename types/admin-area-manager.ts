export interface RegionalStatusCount {
  status: string;
  total_count: number;
}

export interface RegionalStatusesCount {
  statusCount: RegionalStatusCount[];
  last_update_at: string;
}
