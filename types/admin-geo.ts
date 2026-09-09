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
