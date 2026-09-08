/** Row shared by branch/return-ho/different-destination manifest lists (cleared_status present). */
export interface ClearedManifestRow {
  order_id: number;
  order_no: string | null;
  order_date: string;
  cleared_status: "Cleared" | "Not-Cleared";
  cleared_at: string | null;
  waybill_id: string;
  customer_name: string;
  phone_no: string;
  address: string;
  cod: number | string;
  delivery_progress: number | null;
  branch_name?: string | null;
  /** Different-destination manifest only. */
  dd_at?: string | null;
  dispatched_at?: string | null;
}

/** Row for the rider manifest list (no cleared_status; has rider_name instead). */
export interface RiderManifestRow {
  order_id: number;
  order_no: string | null;
  order_date: string;
  waybill_id: string;
  customer_name: string;
  address: string;
  phone_no: string;
  cod: number | string;
  rider_name: string | null;
  delivery_progress: number | null;
  branch_name: string | null;
}

/** Row for the return-to-client manifest list (smallest shape, no branch/status). */
export interface ReturnClientManifestRow {
  order_id: number;
  order_no: string | null;
  order_date: string;
  waybill_id: string;
  customer_name: string;
  address: string;
  phone_no: string;
  cod: number | string;
  delivery_progress: number | null;
}

interface BaseManifestListParams {
  page?: number;
  perPage?: number;
  orderBy?: string;
  orderByDirection?: "asc" | "desc";
  dateRange?: string;
  order_no?: string;
  waybill_id?: string;
  customer_name?: string;
  address?: string;
  branch_name?: string;
}

export interface BranchManifestListParams extends BaseManifestListParams {
  status?: string;
  branchId?: number;
  staffId?: number;
}

export interface RiderManifestListParams extends BaseManifestListParams {
  riderId?: number;
  rider_name?: string;
}

export interface ReturnHOManifestListParams extends BaseManifestListParams {
  branchId?: number;
  staffId?: number;
}
