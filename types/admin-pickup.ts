/** A row from GET /api/v1/pickup-request/list (PickupRequestListAction). */
export interface AdminPickupRow {
  id: number;
  pickup_id: string;
  requested_date: string;
  /** Client name. */
  name: string;
  pick_address: string | null;
  pickup_branch: string | null;
  order_count: number;
  branch_orders_received: number | null;
  note: string | null;
  /** Vehicle type name. */
  type_name: string | null;
  rider: string | null;
  status_changed_date: string | null;
  status: string | null;
}

export interface AdminPickupListParams {
  page?: number;
  perPage?: number;
  orderBy?:
    | "pickup_id"
    | "requested_date"
    | "client_name"
    | "pickup_address"
    | "pickup_branch"
    | "no_of_orders"
    | "vehicle_type"
    | "rider";
  orderByDirection?: "asc" | "desc";
  client_name?: string;
  pickup_branch?: string;
  rider_name?: string;
  pickup_id?: string;
  start_date?: string;
  end_date?: string;
}

/** Payload shared by assign-rider / branch-received / cancel / fail (bulk-by-id). */
export interface PickupRequestIdsPayload {
  request_ids: number[];
}

export interface AssignRiderPayload extends PickupRequestIdsPayload {
  staff_id: number;
}

export interface CancelOrFailPickupPayload extends PickupRequestIdsPayload {
  reason: string;
}
