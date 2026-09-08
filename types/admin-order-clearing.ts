/** A row from GET /v1/order-clearing/today-order-clear/list. */
export interface TodayOrderClearRow {
  order_id: number;
  created_at: string;
  cleared_status: "Cleared" | "Not Cleared";
  waybill_id: string;
  customer_name: string;
  phone_no: string;
  address: string;
  cod: number | string;
  warehouse: string | null;
}

export interface TodayOrderClearListParams {
  page?: number;
  perPage?: number;
  orderBy?: string;
  orderByDirection?: "asc" | "desc";
  branchId?: number;
  waybill_id?: string;
  customer_name?: string;
  phone_no?: string;
  address?: string;
}

/** A row from GET /v1/order-clearing/all-order-clear/list (note: cleared_status is a raw 0/1 here). */
export interface AllOrderClearRow {
  order_id: number;
  created_at: string;
  cleared_status: boolean | number;
  cleared_at: string | null;
  cleared_by: string | null;
  waybill_id: string;
  client_name: string | null;
  customer_name: string;
  collected_by: string | null;
}

export interface AllOrderClearListParams {
  page?: number;
  perPage?: number;
  orderBy?: string;
  orderByDirection?: "asc" | "desc";
  dateRange?: string;
  clearedBy?: number;
  collectedBy?: number;
  clearedFilter?: boolean;
  waybill_id?: string;
  customer_name?: string;
  client_name?: string;
}
