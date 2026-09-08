/** A row from GET /api/v1/client-pickup-request/list. */
export interface PickupRow {
  id: number;
  pickup_id: string;
  requested_date: string;
  name: string | null;
  pick_address: string | null;
  pickup_branch: string | null;
  order_count: number;
  branch_orders_received: number | null;
  note: string | null;
  type_name: string | null;
  rider: string | null;
  status_changed_date: string | null;
  status: string | null;
}

export interface PickupListParams {
  page?: number;
  perPage?: number;
  orderBy?: string;
  orderByDirection?: "asc" | "desc";
  status?: string;
  branch?: number;
  pickup_id?: string;
  name?: string;
  pick_address?: string;
}

/** Payload for POST /api/v1/client-pickup-request/create. */
export interface CreatePickupPayload {
  vehicle_type_id: number;
  order_count: number;
  note?: string;
}

/** Payload for PUT /api/v1/client-pickup-request/cancel. */
export interface CancelPickupPayload {
  request_id: number;
  reason: string;
}
