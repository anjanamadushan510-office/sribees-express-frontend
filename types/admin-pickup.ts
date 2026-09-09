export type { PickupRequest } from "@/types/pickup";

/** Staff pickup-request filters. `status_filter` accepts a comma-separated list. */
export interface AdminPickupListParams {
  client_id?: number;
  status_filter?: string;
}
