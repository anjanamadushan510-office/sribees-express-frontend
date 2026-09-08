/** A row from GET /api/v1/waybill-request/list (WaybillRequestListAction). */
export interface WaybillRequestRow {
  id: number;
  client_no: string | null;
  client: string | null;
  created_at: string;
  quantity: number;
  barcode_quantity: number;
  from_barcode: string;
  last_used_barcode: string | null;
  verified_at: string | null;
  to_barcode: string;
  pick_address: string | null;
  city: string | null;
  business_phone_no: string | null;
  request_status: "Pending" | "Done" | "Rejected" | string;
  is_active: boolean | number;
}

export interface WaybillRequestListParams {
  page?: number;
  perPage?: number;
  orderBy?:
    | "id"
    | "client"
    | "request_date"
    | "no_of_waybills"
    | "no_of_barcodes"
    | "from_barcode"
    | "to_barcode"
    | "confirm_date"
    | "request_status";
  orderByDirection?: "asc" | "desc";
  clientID?: number;
  client?: string;
  /** WaybillRequestStatus enum value (int). */
  request_status?: number;
}

/** Payload for POST /api/v1/waybill-request/create (CreateWaybillRequestDTO). */
export interface CreateWaybillRequestPayload {
  client_id: number;
  quantity: number;
  barcode_quantity: number;
  from: string;
  to: string;
}
