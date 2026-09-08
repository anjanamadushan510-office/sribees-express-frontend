/** A row from GET /api/v1/cities/list (CityListAction). */
export interface CityRow {
  id: number;
  city: string;
  district: string | null;
  branch: string | null;
  zone: string | null;
  postcode: string | number | null;
  status: string;
}

export interface CityListParams {
  page?: number;
  perPage?: number;
  orderBy?: string;
  orderByDirection?: "asc" | "desc";
  city_name?: string;
}

/** GET /api/v1/cities/{city} → data.city (raw City model). */
export interface CityDetail {
  id: number;
  name_en: string;
  postcode: string | number | null;
  longitude: number | string | null;
  latitude: number | string | null;
  district_id: number;
  zone_id: number;
  branch_id: number;
}

/** Payload for POST /api/v1/cities/create and PUT /api/v1/cities/update/{city}. */
export interface SaveCityPayload {
  name_en: string;
  postcode?: number;
  longitude?: number;
  latitude?: number;
  district_id: number;
  zone_id: number;
  branch_id: number;
}

/** A row from GET /api/v1/zones/list (ZoneListAction). */
export interface ZoneRow {
  id: number;
  name: string;
  margin_kg: number | string;
  delivery_start_kg: number | string;
  delivery_additional_kg: number | string;
  return_start_kg: number | string;
  return_additional_kg: number | string;
}

export interface ZoneListParams {
  page?: number;
  perPage?: number;
  orderBy?: string;
  orderByDirection?: "asc" | "desc";
  zone_name?: string;
}

/** GET /api/v1/zones/{zone} → data[0].value (bare-list envelope shape, zone model + cities). */
export interface ZoneDetail {
  id: number;
  name: string;
  first_kg: number | string;
  after_kg: number | string;
  return_first_kg: number | string;
  return_after_kg: number | string;
  delivery_weight_margin: number | string;
  cities?: { id: number; name_en: string }[];
}

/** Payload for POST /api/v1/zones/create and PUT /api/v1/zones/update/{zone}. */
export interface SaveZonePayload {
  name: string;
  city_ids: number[];
  first_kg: number;
  after_kg: number;
  return_first_kg: number;
  return_after_kg: number;
  delivery_weight_margin: number;
}
