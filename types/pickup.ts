import type { ListRange } from "@/types/api";

/** `PickupRequestOut` from the backend. */
export interface PickupRequest {
  id: number;
  client_id: number;
  branch_id: number | null;
  assigned_rider_id: number | null;
  pickup_address: string;
  postal_city_id: number;
  contact_phone: string;
  requested_date: string;
  status: string;
  created_at: string;
}

/** Body for `POST /client-portal/pickup-requests` (ClientPickupRequestCreate). */
export interface CreatePickupPayload {
  branch_id?: number | null;
  pickup_address: string;
  /** Picked from `/client-portal/postal-cities`, never typed. */
  postal_city_id: number;
  contact_phone: string;
  /** ISO date, e.g. "2026-09-12". */
  requested_date: string;
}

export type PickupListParams = ListRange;
