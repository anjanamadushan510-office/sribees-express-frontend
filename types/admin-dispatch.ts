/**
 * GET /fleet/dispatch/pickup-postal-cities — one pickup area with parcels
 * waiting. Grouped by the postal city of the merchant outlet the parcel is
 * collected from, which is how a dispatcher divides riders.
 */
export interface DispatchPostalCity {
  postal_city_id: number;
  name: string;
  district: string | null;
  /** `pending` orders — booked, nobody sent yet. */
  awaiting_rider: number;
  /** `pickup_scheduled` orders — a rider has them. */
  scheduled: number;
}

/** GET /fleet/dispatch/pickups — one parcel to collect. Money is a decimal string. */
export interface DispatchPickup {
  order_id: number;
  waybill_id: string | null;
  status_key: string;
  status_name: string;
  client_id: number;
  client_name: string | null;
  pickup_location_name: string | null;
  pickup_contact_phone: string | null;
  pickup_address: string | null;
  pickup_postal_city_id: number | null;
  pickup_postal_city: string | null;
  destination_postal_city: string | null;
  weight_kg: string;
  /** cod | prepaid — whether the rider collects cash at the door. */
  payment_method: string;
  cod_amount: string;
  delivery_charge: string | null;
  rider_id: number | null;
  rider_name: string | null;
  created_at: string;

  /**
   * `forward` — collect from a merchant and deliver to a customer, which is
   * every other row here.
   *
   * `return` — collect from a **customer** and carry the goods back to the
   * merchant. The roles on the row are reversed: `client_name` is the merchant
   * who will receive it, and `pickup_location_name` is the person handing it
   * over. A return raised in a merchant's own system lands on this board with
   * no other announcement, so it has to be readable as one at a glance.
   */
  order_kind: "forward" | "return";
  return_trigger: "failed_delivery" | "post_delivery" | null;
  /** The forward waybill — the number actually printed on the parcel. */
  parent_waybill_id: string | null;
}

export interface DispatchPickupParams {
  pickup_postal_city_id?: number;
  status_key?: "pending" | "pickup_scheduled";
  order_kind?: "forward" | "return";
}

/** POST /fleet/dispatch/pickups/assign — at most 200 orders per call. */
export interface DispatchAssignRequest {
  order_ids: number[];
  rider_id: number;
}

export interface DispatchAssignResult {
  rider_id: number;
  assigned: DispatchPickup[];
}

export const MAX_DISPATCH_BATCH = 200;
