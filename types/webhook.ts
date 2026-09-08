/**
 * Client webhook config (Modules/Orders WebHookController, auth:client).
 * `key_1`, `key_4`..`key_23` map internal order-status keys (PrimaryStatusType
 * `key_N`, note `key_2`/`key_3` are deliberately absent from the backend DTO)
 * to whatever status code string the client's own receiving endpoint expects.
 */
export interface StatusMappingKeys {
  key_1?: string | null;
  key_4?: string | null;
  key_5?: string | null;
  key_6?: string | null;
  key_7?: string | null;
  key_8?: string | null;
  key_9?: string | null;
  key_10?: string | null;
  key_11?: string | null;
  key_12?: string | null;
  key_13?: string | null;
  key_14?: string | null;
  key_15?: string | null;
  key_16?: string | null;
  key_17?: string | null;
  key_18?: string | null;
  key_19?: string | null;
  key_20?: string | null;
  key_21?: string | null;
  key_22?: string | null;
  key_23?: string | null;
}

export const STATUS_MAPPING_KEYS = [
  "key_1",
  "key_4",
  "key_5",
  "key_6",
  "key_7",
  "key_8",
  "key_9",
  "key_10",
  "key_11",
  "key_12",
  "key_13",
  "key_14",
  "key_15",
  "key_16",
  "key_17",
  "key_18",
  "key_19",
  "key_20",
  "key_21",
  "key_22",
  "key_23",
] as const;

/** GET /v1/webhook/list (WebHookController::getStatusMapping) → data. */
export interface StatusMappingConfig {
  url: string | null;
  method: string | null;
  mapping_status: string | null;
}

/** PUT /v1/webhook/status-mapping/update payload (UpdateStatusMappingDTO). */
export interface UpdateStatusMappingPayload extends StatusMappingKeys {
  url?: string;
  method?: "post";
}

/**
 * PUT /v1/webhook/order-mapping/update payload (UpdateOrderMappingDTO) — maps
 * each order field to the key name the client's endpoint expects it under,
 * plus up to 4 custom header/value pairs sent with the outgoing webhook
 * request. Write-only on the backend — there is no "get order mapping"
 * endpoint to prefill this form from.
 */
export interface UpdateOrderMappingPayload {
  url?: string;
  method?: "post";
  waybill_id?: string;
  order_no?: string;
  customer_name?: string;
  address?: string;
  phone_no?: string;
  phone_no2?: string;
  description?: string;
  city_id?: string;
  cod?: string;
  note?: string;
  status_id?: string;
  header_1?: string;
  header_2?: string;
  header_3?: string;
  header_4?: string;
  value_1?: string;
  value_2?: string;
  value_3?: string;
  value_4?: string;
}
