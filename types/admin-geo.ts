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

/**
 * GET /geo/zone-lanes — the price between two zones. A quote from an outlet in
 * the origin zone to a postal city in the destination zone uses the lane when
 * it is active, and falls back to the destination zone's own rate otherwise.
 */
export interface ZoneLane {
  id: number;
  origin_zone_id: number;
  destination_zone_id: number;
  first_kg: string;
  after_kg: string;
  /**
   * What the *reverse* leg of this corridor costs the merchant — the return
   * fee, charged when a parcel goes back to them rather than to a customer.
   * `Zone` has always carried this pair; lanes gained it with returns.
   */
  return_first_kg: string;
  return_after_kg: string;
  is_active: boolean;
}

export interface ZoneLaneCreate {
  origin_zone_id: number;
  destination_zone_id: number;
  first_kg: string;
  after_kg: string;
  /**
   * Optional on the wire, and *not* optional-meaning-zero: omitted, the API
   * fills it with this lane's own delivery rate. A lane that silently returned
   * parcels for free is the failure worth designing against — nobody notices a
   * 0.00 until the month-end invoice. The form below pre-fills it instead of
   * leaving it blank, for the same reason.
   */
  return_first_kg?: string;
  return_after_kg?: string;
}

export interface ZoneLaneUpdate {
  first_kg?: string;
  after_kg?: string;
  return_first_kg?: string;
  return_after_kg?: string;
  is_active?: boolean;
}

/**
 * A Sri Lanka Post office town — the one vocabulary every address is written
 * in. `zone_id: null` means nobody delivers there yet; the whole national
 * directory (2,111 rows) is seeded, and delivery is rolled out district by
 * district by giving rows a zone.
 */
/** The little a postal city's own row says about a branch covering it. */
export interface PostalCityBranchRef {
  id: number;
  name: string;
}

export interface PostalCity {
  id: number;
  name: string;
  district: string | null;
  province: string | null;
  zone_id: number | null;
  is_active: boolean;
  /** Empty until a branch covers it — possibly more than one. */
  branches: PostalCityBranchRef[];
}

export interface PostalCityCreate {
  name: string;
  district?: string | null;
  province?: string | null;
  zone_id?: number | null;
}

/** The staff list is paged and carries a total — it is the national directory. */
export interface PostalCityPage {
  items: PostalCity[];
  total: number;
  limit: number;
  offset: number;
}

export interface PostalCityListParams {
  search?: string;
  district?: string;
  province?: string;
  zone_id?: number;
  /** Only the cities one branch covers. */
  branch_id?: number;
  /** `false` is the one that matters: what is not delivered to yet. */
  zoned?: boolean;
  limit?: number;
  offset?: number;
}

/** Rollout progress for one district: priced (`zoned`) and covered by a branch. */
export interface PostalCityRegion {
  province: string;
  district: string;
  total: number;
  zoned: number;
  covered: number;
}

/** Name a region or list ids, never both. */
interface RegionOrIds {
  district?: string;
  province?: string;
  postal_city_ids?: number[];
}

/** `zone_id: null` stops delivery to the selection. */
export interface PostalCityZoneAssign extends RegionOrIds {
  zone_id: number | null;
}

/** Additive; `detach: true` removes the selection from the branch instead. */
export interface PostalCityBranchAssign extends RegionOrIds {
  branch_id: number;
  detach?: boolean;
}

/**
 * Coverage is a count, not a list: a branch covers hundreds of postal cities.
 * List them with `listPostalCities({ branch_id })`.
 */
export interface Branch {
  id: number;
  name: string;
  address: string | null;
  phone_no: string | null;
  /**
   * The depot's map pin. Always both or neither — the database enforces it
   * (`ck_branches_coordinates_complete`) and the API rejects a half pair.
   * Null for a branch nobody has pinned yet.
   *
   * Read by the rider app: a rider carrying a cross-zone parcel navigates to
   * the branch it is handed over at, and a pin cannot be misread the way a
   * free-text address handed to a maps search can — several Sri Lankan postal
   * cities share a name.
   */
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  postal_city_count: number;
}

export interface BranchCreate {
  name: string;
  address?: string | null;
  phone_no?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}
