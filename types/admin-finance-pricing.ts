/**
 * GET/POST /finance/clients/{id}/zone-rates, PATCH /finance/zone-rates/{id}.
 *
 * A merchant-specific rate for one destination zone — `finance.price_delivery`
 * checks here before falling back to a `ZoneLane`/`Zone`'s standard rate.
 * Money fields are decimal strings, same convention as `Zone`/`ZoneLane`.
 */
export interface ClientZoneRate {
  id: number;
  client_id: number;
  zone_id: number;
  first_kg: string;
  after_kg: string;
  is_active: boolean;
  created_at: string;
}

/** Posting a second time for the same (client_id, zone_id) replaces it. */
export interface ClientZoneRateCreate {
  client_id: number;
  zone_id: number;
  first_kg: string;
  after_kg: string;
}

export interface ClientZoneRateUpdate {
  first_kg?: string;
  after_kg?: string;
  is_active?: boolean;
}

/**
 * A merchant's own rate for one (origin zone, destination zone) corridor —
 * the most specific tier `price_delivery()` applies, ahead of both
 * `ClientZoneRate` and the standard `ZoneLane`/`Zone`.
 */
export interface ClientZoneLaneRate {
  id: number;
  client_id: number;
  origin_zone_id: number;
  destination_zone_id: number;
  first_kg: string;
  after_kg: string;
  is_active: boolean;
  created_at: string;
}

export interface ClientZoneLaneRateCreate {
  client_id: number;
  origin_zone_id: number;
  destination_zone_id: number;
  first_kg: string;
  after_kg: string;
}

export interface ClientZoneLaneRateUpdate {
  first_kg?: string;
  after_kg?: string;
  is_active?: boolean;
}
