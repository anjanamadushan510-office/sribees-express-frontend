import { get } from "@/lib/api/client";

/** One step of a parcel's journey, as the public endpoint reports it. */
export interface PublicTrackingEvent {
  status_name: string;
  occurred_at: string;
}

/**
 * `GET /public/track/{waybill_id}` — unauthenticated tracking.
 *
 * Deliberately narrow, and the narrowness is the feature: the endpoint is
 * public and a waybill is printed on the outside of the parcel, so it returns
 * no recipient name, phone, address or COD amount. If the page needs any of
 * those it is asking the wrong endpoint — a signed-in client sees their own
 * orders in full through /client-portal/orders.
 */
export interface PublicTracking {
  waybill_id: string;
  current_status: string;
  destination_postal_city: string | null;
  created_at: string;
  events: PublicTrackingEvent[];
}

export async function trackWaybill(waybillId: string): Promise<PublicTracking> {
  return get<PublicTracking>(`/public/track/${encodeURIComponent(waybillId)}`);
}

/** Signed-in client tracking, which does include the full order. */
export { trackByWaybill, getClientOrderHistory } from "@/lib/api/orders";
