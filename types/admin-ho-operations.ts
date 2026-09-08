/** A row from GET /v1/ho-operations/orders/list (OrdersListAction). */
export interface HOOrderRow {
  id: number;
  order_date: string;
  waybill_id: string;
  client_name: string | null;
  customer_name: string;
  address: string;
  phone_no: string;
  cod: number | string;
  delivery_charge: number | string;
  district: string | null;
  city: string | null;
  branch_name: string | null;
  temporary_branch: string | null;
  status: string | null;
  remark: string | null;
}

export interface HOOrderListParams {
  page?: number;
  perPage?: number;
  orderBy?: string;
  orderByDirection?: "asc" | "desc";
  statuses?: string[];
  clientID?: number;
  branchID?: number;
  waybill_id?: string;
  client_name?: string;
  customer_name?: string;
}

/** A row from GET /v1/ho-operations/orders/clearance/list (HOClearanceListAction). */
export interface HOClearanceRow {
  id: number;
  order_date: string;
  waybill_id: string;
  client_name: string | null;
  customer_name: string;
  delivery_address: string;
  phone_no: string;
  cod: number | string;
  delivery_charge: number | string;
  original_branch: string | null;
  district: string | null;
  city: string | null;
  rider: string | null;
  remarks: string | null;
  status: string | null;
}

export interface HOClearanceListParams {
  page?: number;
  perPage?: number;
  orderBy?: string;
  orderByDirection?: "asc" | "desc";
  branchID?: number;
  waybill_id?: string;
  customer_name?: string;
  client_name?: string;
}

/** A row from GET /v1/ho-operations/orders/order-reversal-history/list. */
export interface ReversalHistoryRow {
  id: number;
  order_id: number;
  order_date: string;
  waybill_id: string;
  comment: string | null;
  reversed_by: string | null;
  from_status_name: string | null;
  to_status_name: string | null;
  data: { rider_name?: string | null; branch_name?: string | null } | null;
}

export interface ReversalHistoryListParams {
  page?: number;
  perPage?: number;
  orderBy?: string;
  orderByDirection?: "asc" | "desc";
  waybill_id?: string;
}
