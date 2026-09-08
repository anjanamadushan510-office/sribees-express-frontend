/**
 * A row from GET /api/v1/orders/list (OrderListAction::getSelectQuery), the
 * staff-side "all orders" list. Paginated via the standard "table" envelope.
 */
export interface AdminOrderRow {
  id: number;
  order_no: string | null;
  order_date: string;
  waybill_id: string;
  delivery_attempts: number;
  client_no: string | null;
  client_name: string | null;
  customer_name: string;
  delivery_address: string | null;
  phone_no: string | null;
  cod: number | string | null;
  delivery_charge: number | string | null;
  original_branch: string | null;
  temporary_branch: string | null;
  sorting_center: string | null;
  district: string | null;
  city: string | null;
  rider: string | null;
  remarks: string | null;
  status_changed_date: string | null;
  collect_dispatch_date: string | null;
  completed_date: string | null;
  invoice_no: string | null;
  invoice_date: string | null;
  clearance_status: "Cleared" | "Not Cleared";
  /** Primary status display name (e.g. "Delivered"). */
  status: string | null;
  delivery_progress: number;
  order_count: number;
  /** Latest order remark text, if any. */
  remark: string | null;
}

/** Query params accepted by GET /api/v1/orders/list (OrderListDTO). */
export interface AdminOrdersListParams {
  page?: number;
  perPage?: number;
  orderBy?: "id" | "order_date" | "waybill_id";
  orderByDirection?: "asc" | "desc";
  client_id?: number;
  waybill_id?: string;
  branch_ids?: number[];
  current_rider_id?: number;
  cleared_status?: boolean;
  statuses?: string[];
  customer_name?: string;
  client_name?: string;
  branch_name?: string;
  city_name?: string;
  delivery_address?: string;
  phone_number?: string;
}

/** One row of GET /api/v1/orders/{order} → data.order_details (OrderTrackAction, DB::select — array of 1). */
export interface AdminOrderDetail {
  order_date: string;
  waybill_id: string;
  order_no: string | null;
  customer_name: string;
  customer_address: string | null;
  customer_phone_no: string | null;
  weight: number | string | null;
  branch_name: string | null;
  description: string | null;
  cod: number | string | null;
  collected_cod: number | string | null;
  remarks: string | null;
  client_name: string | null;
  customer_district: string | null;
  customer_city: string | null;
  completed_date: string | null;
  current_status: string | null;
  temporary_branch: string | null;
}

/** An entry in data.tracking_history. */
export interface AdminOrderTrackEntry {
  status_name: string | null;
  status_created_at: string | null;
  remarks: string | null;
  name?: string | null;
  status_id: number | null;
  media_urls?: { id: number; name: string; file_name: string; url: string }[];
}

/** An entry in data.order_remarks. */
export interface AdminOrderRemark {
  id: number;
  remark_by: string | null;
  remark: string | null;
  remarkable_type: "Staff" | "Client" | string | null;
  created_at: string;
}

/** An entry in data.reversal_history. */
export interface AdminOrderReversal {
  id: number;
  order_date: string;
  from_status: string | null;
  to_status: string | null;
  reversed_by: string | null;
  comment: string | null;
}

/** Full result of GET /api/v1/orders/{order} (all 4 sections, dataKey omitted). */
export interface AdminOrderFullDetail {
  order_details: AdminOrderDetail | null;
  order_remarks: AdminOrderRemark[];
  tracking_history: AdminOrderTrackEntry[];
  reversal_history: AdminOrderReversal[];
}

/** Payload for POST /api/v1/orders/create-auto-waybill (SingleOrderDTO). */
export interface CreateAdminOrderPayload {
  client_id: number;
  order_no: string;
  customer_name: string;
  address: string;
  phone_no: string;
  phone_no2?: string;
  description?: string;
  city_id: number;
  cod: number;
  note?: string;
}

/**
 * Payload for POST /api/v1/orders/create (SingleOrderManualWaybillDTO) — same
 * fields as CreateAdminOrderPayload plus a required `waybill_id`, validated
 * backend-side against `/^([A-Z]{1}[0-9]{7}|[0-9]{8}|[A-Z]{2}[0-9]{6})$/`
 * (8 digits, or 1 letter + 7 digits, or 2 letters + 6 digits) and
 * `unique:orders,waybill_id`.
 */
export interface CreateAdminOrderManualWaybillPayload extends CreateAdminOrderPayload {
  waybill_id: string;
}

/** Payload for POST /api/v1/orders/status-update (UpdateOrderStatusDTO). */
export interface UpdateOrderStatusPayload {
  waybill_id: string;
  status_key: string;
  sorting_layer_id?: number;
}

/** Payload for POST /api/v1/orders/order-remarks/create (CreateOrderRemarkDTO). */
export interface CreateOrderRemarkPayload {
  waybill_id: string;
  remark: string;
  is_archive?: boolean;
}
