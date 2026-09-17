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
