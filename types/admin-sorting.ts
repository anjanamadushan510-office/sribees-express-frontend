/** A row from GET /v1/other-operations/orders/list (CitiesAssignListAction). */
export interface CityAssignRow {
  id: number;
  order_date: string;
  waybill_id: string;
  client_name: string | null;
  delivery_address: string | null;
  /** Free-text city suggestion (e.g. from address parsing) awaiting HO confirmation. */
  suggested_city: string | null;
}

export interface CityAssignListParams {
  page?: number;
  perPage?: number;
  orderBy?: string;
  orderByDirection?: "asc" | "desc";
  waybill_id?: string;
  client_name?: string;
  delivery_address?: string;
  suggested_city?: string;
}

/** Payload for PUT /v1/other-operations/orders/update-order-city. */
export interface UpdateOrderCityPayload {
  waybill_id: string;
  city_id: number;
}

/** One row of GET /v1/sorting-dashboard → data.sortingCount (SortingCountAction). */
export interface SortingCountRow {
  scanned_at_sorting_center: string | null;
  destination_warehouse: string | null;
  collected_at_sorting_center: number;
  collect_and_dispatchs: number;
  pending_orders: number;
}

export interface SortingCountParams {
  /** "YYYY-MM-DD HH:mm - YYYY-MM-DD HH:mm" */
  status_change_date?: string;
}

/**
 * A row from GET /v1/sorting-buckets/list and GET /v1/sorting-buckets/open
 * (SortingBucketController — one row per physical scanning-station session
 * a staff member has opened). Live-verified against the WSL backend.
 */
export interface SortingBucketRow {
  id: number;
  open_at: string;
  close_at: string | null;
  operation_type: "day" | "night";
  user_id: number;
  sorting_center_id: number;
  sorting_section_id: number;
  order_count: number | null;
  closed_by?: number | null;
  status: "Open" | "Closed";
  created_at: string;
  updated_at: string;
  user?: { id: number; name: string } | null;
  sortingCenter?: { id: number; name: string } | null;
  sorting_center?: { id: number; name: string } | null;
  sortingSection?: { id: number; name: string } | null;
  sorting_section?: { id: number; name: string } | null;
}

/** GET /v1/sorting-buckets/list → data (SortingBucketController::sortingBuckets). */
export interface SortingBucketsListResult {
  /** Root (sort_order=0) SortingLayers, pluck(name,id) → `{}` when empty. */
  sorting_layers: Record<string, string>;
  buckets: SortingBucketRow[];
}

export interface SortingBucketListParams {
  page?: number;
  perPage?: number;
  orderBy?: string;
  orderByDirection?: "asc" | "desc";
}

/**
 * POST /v1/sorting-buckets/open (OpenSortingBucketDTO). No lookup endpoint
 * exists for `sorting_center_id` (confirmed gap — grepped every module route
 * file) so it's entered as a plain number in the UI; `sorting_section_id`
 * can be sourced from `get-buckets?sorting_layer_id=<sorting_center_id>`
 * once that number is known.
 */
export interface OpenSortingBucketPayload {
  operation_type: "day" | "night";
  sorting_center_id: number;
  sorting_section_id: number;
}

/** A full SortingLayers row, as returned by GET /v1/sorting-buckets/get-buckets. */
export interface SortingLayerOption {
  id: number;
  name: string;
  description: string | null;
  status: number;
  sort_order: number;
  short_code: string | null;
  parent_id: number | null;
  is_final_layer: number;
  sorting_center_id: number | null;
  device_url: string | null;
  device_id: string | null;
  color: string | null;
}

/** A row from POST /v1/sorting-buckets/hold-orders and GET .../bucket-close/list. */
export interface HoldOrderRow {
  sorting_bucket: string;
  client_name: string;
  waybill_id: string;
  destination_branch: string;
}

/**
 * A device row from GET /v1/sorting-buckets/device-settings. Live-verified:
 * the controller's `DataTables::collection(...)->make(true)` call returns a
 * `JsonResponse` object that then gets run through `convertToAPIData`'s
 * `foreach` (iterating its *public properties*, not its JSON body) — the
 * real payload ends up nested at `data.original.data`, alongside
 * `data.headers` and `data.exception` (both noise). `getDeviceSettings()` in
 * `lib/api/admin-sorting.ts` unwraps this exact path.
 */
export interface DeviceSettingRow {
  id: number;
  bucket_name: string;
  device_url: string | null;
  parent_bucket: string | null;
}

/** PUT /v1/sorting-buckets/device-settings (UpdateDeviceSettingsDTO). */
export interface UpdateDeviceSettingsPayload {
  id: number;
  device_url: string;
  device_id?: string;
}

/** GET /v1/bags/current?layer_id= → data.bag (nullable). */
export interface BagRow {
  id: number;
  ref_id: string;
  bucket_id: number;
  layer_id: number;
  branch_id: number | null;
  created_by: number;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  items_count?: number;
}
