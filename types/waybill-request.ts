/**
 * A row from GET /v1/client-waybill-request/list (auth:client,
 * ClientWaybillRequestListAction) — unions the client's own rows from both
 * `waybill_request_ranges` and legacy `waybill_requests` tables.
 */
export interface ClientWaybillRequestRow {
  id: number;
  client: string;
  request_date: string;
  no_of_waybills: number;
  no_of_barcodes: number;
  from_barcode: string | null;
  last_used_waybill: string | null;
  confirm_date: string | null;
  to_barcode: string | null;
  request_status: "Pending" | "Done" | "Rejected" | "unknown";
}

export interface ClientWaybillRequestListParams {
  page?: number;
  perPage?: number;
  client?: string;
}

/**
 * POST /v1/client-waybill-request/create (CreateClientWaybillRequestDTO) —
 * only these two fields are client-submittable; `client_id`/`client`/status
 * are auto-injected server-side from the authenticated user. The backend
 * allows only one request per calendar day per client.
 */
export interface CreateClientWaybillRequestPayload {
  quantity: number;
  barcode_quantity: number;
}
