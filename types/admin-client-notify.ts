/**
 * A row from GET /v1/client-notify/list (ClientNotifyList) — one row per
 * (announcement, recipient client) pair, so the same `id` repeats once per
 * client it was sent to. Pagination `total` counts distinct announcements,
 * not rows, so don't assume `items.length` lines up with page size.
 */
export interface AdminClientNotifyRow {
  id: number;
  date: string;
  announcement_message: string;
  type: "sms" | "email";
  client_id: number | null;
  client_name: string | null;
  client_email: string | null;
}

export interface AdminClientNotifyListParams {
  page?: number;
  perPage?: number;
}

/** POST /v1/client-notify/create-client-notify (CreateClientNotifyDTO). */
export interface CreateClientNotifyPayload {
  type: ("sms" | "email")[];
  client_ids: number[];
  subject?: string;
  email_body?: string;
  sms_body?: string;
}

/** GET /v1/client-notify/view/{notify} → data (array of per-recipient rows). */
export interface AdminClientNotifyRecipient {
  type: "sms" | "email";
  subject?: string;
  body: string;
  client_id: number;
  client_name: string;
  client_email: string | null;
}
