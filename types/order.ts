import type { ListRange } from "@/types/api";

/** The status catalogue entry embedded in every order. */
export interface OrderStatus {
  id: number;
  key: string;
  name: string;
  category: string;
  is_terminal: boolean;
}

/**
 * `OrderOut` from the backend, used verbatim for both the list and detail
 * views — the API returns the same model for `GET /client-portal/orders` and
 * `GET /client-portal/orders/{id}`, so there is no separate "row" type.
 *
 * Money and weight arrive as **strings**, not numbers: they are Postgres
 * NUMERIC columns and are serialised as decimal strings so no value is
 * rounded through a float on the way here. Parse at the point of display,
 * never for arithmetic that matters.
 */
export interface ClientOrder {
  id: number;
  waybill_id: string | null;
  client_id: number;
  postal_city_id: number;
  origin_branch_id: number | null;
  current_branch_id: number | null;
  current_rider_id: number | null;
  current_status: OrderStatus;
  weight_kg: string;
  cod_amount: string;
  collected_cod_amount: string;
  delivery_charge: string | null;
  delivery_attempts: number;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
  handover_code_required: boolean;
  handover_verified_at: string | null;
  handover_attempts: number;
  pickup_location_name: string | null;
  pickup_contact_phone: string | null;
  pickup_address: string | null;
  pickup_postal_city: string | null;
  pickup_district: string | null;
  pickup_province: string | null;
  pickup_latitude: number | null;
  pickup_longitude: number | null;
  requested_delivery_date: string | null;
  requested_delivery_window: string | null;
  handling: string[] | null;
  created_at: string;

  /**
   * Returns. `'forward'` and nulls on every ordinary parcel, including every
   * one booked before returns existed.
   *
   * A return is a *second order* whose pickup address is this one's delivery
   * address and vice versa — the journey back to you. It carries its own
   * waybill (prefixed `SXR`) and its own fee, and this order's own history is
   * left intact. A forward order with a return leg running against it sits in
   * `return_in_transit` until the goods are back with you.
   */
  order_kind: "forward" | "return";
  parent_order_id: number | null;
  return_reason: string | null;
  return_trigger: "failed_delivery" | "post_delivery" | null;
  /** `[{sku, name, quantity}]` on a partial return; null means the whole parcel. */
  return_items: Array<Record<string, unknown>> | null;
}

/** One entry of `GET /client-portal/orders/{id}/history`, oldest first. */
export interface OrderHistoryEntry {
  from_status_id: number | null;
  to_status: OrderStatus;
  actor_type: string;
  actor_id: number | null;
  reason: string | null;
  created_at: string;
}

/**
 * Query parameters for the client order list.
 *
 * Only these three are supported. The Laravel list accepted free-text search,
 * date ranges and multi-status filters; this endpoint takes a single
 * `status_key` plus limit/offset, so any richer filtering has to be a backend
 * change rather than something faked by over-fetching in the browser.
 */
export interface ClientOrdersListParams extends ListRange {
  status_key?: string;
}

/** Body for `POST /client-portal/orders` (ClientOrderCreate). */
export interface CreateClientOrderPayload {
  postal_city_id: number;
  origin_branch_id?: number | null;
  weight_kg?: string | number | null;
  cod_amount?: string | number | null;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
}
