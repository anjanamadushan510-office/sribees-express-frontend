import type { ListRange } from "@/types/api";

export type { ClientOrder as AdminOrder, OrderStatus, OrderHistoryEntry } from "@/types/order";

/**
 * Staff order list filters.
 *
 * `client_id` is the one thing the staff list can do that the portal cannot:
 * look at another merchant's shipments. Free-text search is still not
 * available — see docs/API-GAPS.md.
 */
export interface AdminOrdersListParams extends ListRange {
  client_id?: number;
  status_key?: string;
  /** Orders currently parked at one branch — the cross-zone handoff view. */
  branch_id?: number;
}

/** Body for POST /shipments/orders/{id}/status. */
export interface OrderStatusTransition {
  /** A `key` from the status catalogue, not a display name. */
  to_status: string;
  reason?: string | null;
}
