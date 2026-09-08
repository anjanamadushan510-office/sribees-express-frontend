/**
 * A row from GET /api/v1/client-orders/list (ClientOrdersListAction::getSelectQuery).
 * The list is paginated via the standard "table" envelope.
 */
export interface ClientOrderRow {
  id: number;
  order_date: string;
  waybill_id: string;
  order_no: string | null;
  customer_name: string;
  delivery_address: string | null;
  phone_no: string | null;
  cod: number | string | null;
  delivery_charge: number | string | null;
  district: string | null;
  city: string | null;
  city_id: number | null;
  district_id: number | null;
  rider: string | null;
  description: string | null;
  remarks: string | null;
  status_changed_date: string | null;
  invoice_no: string | null;
  /** Primary status display name (e.g. "Delivered"). */
  status: string | null;
  enter_by: string | null;
  /** Present only when the client has AI delivery progress enabled. */
  delivery_progress?: number;
}

/** Full order detail from GET /api/v1/client-orders/{order} → data.order_details. */
export interface ClientOrderDetail {
  id: number;
  waybill_id: string;
  order_no: string | null;
  customer_name: string;
  address: string | null;
  phone_no: string | null;
  phone_no_1?: string | null;
  phone_no_2?: string | null;
  cod: number | string | null;
  delivery_charge: number | string | null;
  description: string | null;
  note: string | null;
  created_at?: string;
  [key: string]: unknown;
}

/** A tracking history entry from GET /api/v1/client-orders/tracking/{order}. */
export interface OrderTrackEntry {
  status_name: string | null;
  status_created_at: string | null;
  remarks: string | null;
  name?: string | null;
  status_id: number | null;
  media_urls?: { url: string; file_name: string }[];
}

/** Payload for POST /api/v1/client-orders/create. */
export interface CreateClientOrderPayload {
  client_id?: number;
  /** Required only when the client is in Manual waybill mode. */
  waybill_id?: string;
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

/** Query parameters accepted by the client orders list endpoint. */
export interface ClientOrdersListParams {
  page?: number;
  perPage?: number;
  orderBy?: "id" | "order_date" | "waybill_id";
  orderByDirection?: "asc" | "desc";
  waybill_id?: string;
  order_no?: string;
  customer_name?: string;
  phone_number?: string;
  delivery_address?: string;
  invoice_no?: string;
  city?: number;
  district?: number;
  /** PrimaryStatusType keys, e.g. ["key_8", "key_12"]. */
  statuses?: string[];
  /** "YYYY-MM-DD HH:mm - YYYY-MM-DD HH:mm" */
  order_date?: string;
}
