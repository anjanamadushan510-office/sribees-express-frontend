/** A row from GET /api/v1/rate-card/list (per-city delivery rates for the client). */
export interface RateCardRow {
  id: number;
  city_name: string;
  district_name: string;
  branch_name: string;
  /** Weight margin (grams) before the next kg band kicks in. */
  delivery_weight_margin: string;
  /** Charge for the first kg. */
  first_kg: string;
  /** Charge per additional kg. */
  after_kg: string;
  return_first_kg: string;
  return_after_kg: string;
}

export interface RateCardListParams {
  page?: number;
  perPage?: number;
  orderBy?: "id" | "city_name";
  orderByDirection?: "asc" | "desc";
  city_name?: string;
  district_name?: string;
  branch_name?: string;
}
