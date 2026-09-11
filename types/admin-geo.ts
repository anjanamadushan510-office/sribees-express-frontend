/** GET /geo/zones — a delivery pricing tier. Money fields are decimal strings. */
export interface Zone {
  id: number;
  name: string;
  first_kg: string;
  after_kg: string;
  return_first_kg: string;
  return_after_kg: string;
  delivery_weight_margin: string;
  is_active: boolean;
}

export interface ZoneCreate {
  name: string;
  first_kg: string;
  after_kg: string;
  return_first_kg: string;
  return_after_kg: string;
  delivery_weight_margin?: string;
}

export interface City {
  id: number;
  name: string;
  district: string | null;
  zone_id: number | null;
  is_active: boolean;
}

export interface CityCreate {
  name: string;
  district?: string | null;
  zone_id?: number | null;
}

export interface Branch {
  id: number;
  name: string;
  address: string | null;
  phone_no: string | null;
  is_active: boolean;
  cities: City[];
}

export interface BranchCreate {
  name: string;
  address?: string | null;
  phone_no?: string | null;
  city_ids?: number[];
}

export interface PostOffice {
  id: number;
  name: string;
  district: string | null;
  province: string | null;
  city_id: number | null;
  is_active: boolean;
}

export interface PostOfficeCreate {
  name: string;
  district?: string | null;
  province?: string | null;
  city_id?: number | null;
}

/**
 * Unlike zones, cities and branches, this list is paged and carries a total:
 * the directory is the national one, seeded with 2,111 rows.
 */
export interface PostOfficePage {
  items: PostOffice[];
  total: number;
  limit: number;
  offset: number;
}

export interface PostOfficeListParams {
  search?: string;
  district?: string;
  province?: string;
  city_id?: number;
  /** `false` is the one that matters: what is left to route. */
  assigned?: boolean;
  limit?: number;
  offset?: number;
}

/** How much of a district is routable, which is the only measure of progress. */
export interface PostOfficeRegion {
  province: string;
  district: string;
  total: number;
  assigned: number;
}

/** `city_id: null` detaches. Name a region or list ids, never both. */
export interface PostOfficeAssign {
  city_id: number | null;
  district?: string;
  province?: string;
  post_office_ids?: number[];
}
