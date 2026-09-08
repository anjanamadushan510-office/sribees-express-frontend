import { api, pickKey, unwrap, unwrapPaginated } from "@/lib/api/client";
import type { ApiResponse, Paginated, Pagination } from "@/types/api";
import type {
  BagRow,
  CityAssignListParams,
  CityAssignRow,
  DeviceSettingRow,
  HoldOrderRow,
  OpenSortingBucketPayload,
  SortingBucketListParams,
  SortingBucketRow,
  SortingBucketsListResult,
  SortingCountParams,
  SortingCountRow,
  SortingLayerOption,
  UpdateDeviceSettingsPayload,
  UpdateOrderCityPayload,
} from "@/types/admin-sorting";

/** GET /api/v1/other-operations/orders/list — orders awaiting HO city confirmation. */
export async function listCityAssignOrders(
  params: CityAssignListParams
): Promise<Paginated<CityAssignRow>> {
  const res = await api.get<ApiResponse<CityAssignRow[]>>("/v1/other-operations/orders/list", {
    params: clean(params),
  });
  return unwrapPaginated<CityAssignRow>(res);
}

/** PUT /api/v1/other-operations/orders/update-order-city. */
export async function updateOrderCity(payload: UpdateOrderCityPayload): Promise<void> {
  await api.put("/v1/other-operations/orders/update-order-city", payload);
}

/**
 * GET /api/v1/sorting-dashboard — `SortingDashboardController::getSortingCount` builds its
 * own `response()->json(['status_code' => 200, 'data' => ...])` by hand (a sixth distinct
 * envelope shape found in this backend: no `success`/`message`/`pagination`/`error` keys at
 * all, and no `convertToAPIData` reshape since it bypasses `APIHelper` entirely).
 */
export async function getSortingCount(params: SortingCountParams): Promise<SortingCountRow[]> {
  const res = await api.get<{ status_code: number; data: { sortingCount: SortingCountRow[] } }>(
    "/v1/sorting-dashboard",
    { params: clean(params) }
  );
  return res.data.data?.sortingCount ?? [];
}

/**
 * GET /api/v1/sorting-buckets/list — the signed-in staff member's own
 * scanning-station bucket sessions (open + closed). `data` is a bespoke
 * object `{sorting_layers, buckets}`, not a flat row array — read directly
 * rather than `unwrapPaginated`.
 */
export async function listSortingBuckets(
  params: SortingBucketListParams
): Promise<{ result: SortingBucketsListResult; pagination: Pagination }> {
  const res = await api.get<ApiResponse<SortingBucketsListResult>>("/v1/sorting-buckets/list", {
    params: clean(params),
  });
  return {
    result: unwrap(res) ?? { sorting_layers: {}, buckets: [] },
    pagination: res.data.pagination ?? { total: 0, per_page: 10, current_page: 1, last_page: 1 },
  };
}

/** GET /api/v1/sorting-buckets/open — only the caller's currently-open buckets. */
export async function listOpenSortingBuckets(
  params: SortingBucketListParams
): Promise<Paginated<SortingBucketRow>> {
  const res = await api.get<ApiResponse<SortingBucketRow[]>>("/v1/sorting-buckets/open", {
    params: clean(params),
  });
  return unwrapPaginated<SortingBucketRow>(res);
}

/** GET /api/v1/sorting-buckets/shift-type — default for the "open bucket" operation_type field. */
export async function getShiftType(): Promise<boolean> {
  const res = await api.get<ApiResponse<unknown>>("/v1/sorting-buckets/shift-type");
  const data = unwrap(res);
  return !!pickKey<boolean>(data, "shift_type");
}

/** POST /api/v1/sorting-buckets/open. Throws with the backend's `message` on failure. */
export async function openSortingBucket(payload: OpenSortingBucketPayload): Promise<void> {
  const res = await api.post<ApiResponse<unknown>>("/v1/sorting-buckets/open", payload);
  const data = unwrap(res);
  const success = pickKey<boolean>(data, "success");
  if (!success) {
    throw new Error(pickKey<string>(data, "message") ?? "Could not open bucket");
  }
}

/**
 * POST /api/v1/sorting-buckets/close. NOTE: as of this build, the live
 * backend 500s on this endpoint — `SortingBucket::closeBucket()`
 * (`Modules/OtherOperations/app/Models/SortingBucket.php`) references a
 * `bags.closed_at` column that doesn't exist yet (matches the "one pending
 * migration" the DB is known to be missing, see BUILD_LOG.md). Flagged, not
 * fixed — out of scope per the standing "don't touch backend" rule.
 */
export async function closeSortingBucket(bucketId: number | string): Promise<void> {
  const res = await api.post<ApiResponse<unknown>>("/v1/sorting-buckets/close", {
    bucket_id: bucketId,
  });
  const data = unwrap(res);
  const success = pickKey<boolean>(data, "success");
  if (!success) {
    throw new Error(pickKey<string>(data, "message") ?? "Could not close bucket");
  }
}

/**
 * GET /api/v1/sorting-buckets/get-buckets?sorting_layer_id= — despite the
 * param name, this must be a `sorting_center` id (validated against that
 * table), not a `sorting_layers` id. Returns the sortable sub-layers under
 * that center.
 */
export async function getSortingBucketOptions(
  sortingCenterId: number | string
): Promise<SortingLayerOption[]> {
  const res = await api.get<ApiResponse<unknown>>("/v1/sorting-buckets/get-buckets", {
    params: { sorting_layer_id: sortingCenterId },
  });
  const data = unwrap(res);
  return pickKey<SortingLayerOption[]>(data, "sorting_layers") ?? [];
}

/** POST /api/v1/sorting-buckets/hold-orders — orders on hold for a given layer. */
export async function listHoldOrders(
  layerId: number | string,
  search?: string
): Promise<HoldOrderRow[]> {
  const res = await api.post<ApiResponse<unknown>>("/v1/sorting-buckets/hold-orders", {
    layer_id: layerId,
    search: { value: search ?? "" },
  });
  const data = unwrap(res);
  return pickKey<HoldOrderRow[]>(data, "data") ?? [];
}

/** POST /api/v1/sorting-buckets/hold-order — put a single waybill on hold. */
export async function holdOrder(waybillId: string): Promise<void> {
  await api.post("/v1/sorting-buckets/hold-order", { waybill_id: waybillId });
}

/**
 * GET /api/v1/sorting-buckets/device-settings. See `DeviceSettingRow`'s
 * doc-comment for why this needs the `data.original.data` unwrap.
 */
export async function getDeviceSettings(): Promise<DeviceSettingRow[]> {
  const res = await api.get<ApiResponse<unknown>>("/v1/sorting-buckets/device-settings");
  const data = unwrap(res);
  const original = pickKey<{ data?: DeviceSettingRow[] }>(data, "original");
  return original?.data ?? [];
}

/** PUT /api/v1/sorting-buckets/device-settings. */
export async function updateDeviceSettings(payload: UpdateDeviceSettingsPayload): Promise<void> {
  const res = await api.put<ApiResponse<unknown>>("/v1/sorting-buckets/device-settings", payload);
  const data = unwrap(res);
  const success = pickKey<boolean>(data, "success");
  if (success === false) {
    throw new Error(pickKey<string>(data, "message") ?? "Could not update device settings");
  }
}

/**
 * GET /api/v1/bags/current?layer_id= — the caller's active bag for a final
 * sorting layer. Backend returns HTTP 400 (not 200) with `data.bag = null`
 * when there's no open bucket — treat that specific case as "no active bag"
 * rather than a hard error.
 */
export async function getCurrentBag(layerId: number | string): Promise<BagRow | null> {
  try {
    const res = await api.get<ApiResponse<unknown>>("/v1/bags/current", {
      params: { layer_id: layerId },
    });
    const data = unwrap(res);
    return pickKey<BagRow>(data, "bag") ?? null;
  } catch (error) {
    if (isAxios400(error)) return null;
    throw error;
  }
}

/** POST /api/v1/bags/ — closes any existing open bag for this layer and opens a new one. */
export async function createBag(layerId: number | string): Promise<BagRow | null> {
  const res = await api.post<ApiResponse<unknown>>("/v1/bags", { layer_id: layerId });
  const data = unwrap(res);
  const inner = pickKey<{ bag: BagRow }>(data, "data");
  return inner?.bag ?? null;
}

/** GET /api/v1/other-operations/bucket-close/list — orders on hold for a layer (`ho-operation`). */
export async function listBucketCloseHoldOrders(layerId: number | string): Promise<HoldOrderRow[]> {
  const res = await api.get<ApiResponse<unknown>>("/v1/other-operations/bucket-close/list", {
    params: { layer_id: layerId },
  });
  const data = unwrap(res);
  return pickKey<HoldOrderRow[]>(data, "bucket_close_orders") ?? [];
}

/** PUT /api/v1/other-operations/bucket-close/process-order-hold — put a waybill on hold (`ho-operation`). */
export async function processOrderHold(waybillId: string): Promise<void> {
  await api.put("/v1/other-operations/bucket-close/process-order-hold", { waybill_id: waybillId });
}

/**
 * PUT /api/v1/other-operations/bucket-close/close-sorting-bucket — despite
 * the near-identical name/permission to `POST /sorting-buckets/close`, this
 * is a DIFFERENT action: it ends the current global night shift (touches a
 * shared `Shift` row, not any one user's bucket) and triggers a
 * `clear-sorting-process` Artisan command for the given layer. `ho-operation`
 * + `sorting-bucket-close` permissions gate it.
 */
export async function endOfShift(layerId: number | string): Promise<void> {
  await api.put("/v1/other-operations/bucket-close/close-sorting-bucket", { layer_id: layerId });
}

function isAxios400(error: unknown): boolean {
  return (
    !!error &&
    typeof error === "object" &&
    "response" in error &&
    (error as { response?: { status?: number } }).response?.status === 400
  );
}

function clean<T extends object>(params: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    out[k] = v;
  }
  return out;
}
