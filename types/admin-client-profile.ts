/**
 * A row from GET /v1/client-profiles/list (ClientProfileAction). `status` is
 * derived from `client_updates.status` (0 = pending, 1 = approved/"updated").
 */
export interface AdminClientProfileRequestRow {
  id: number;
  client_id: number;
  name: string;
  email: string | null;
  address: string | null;
  business_phone_no: string | null;
  status: "pending" | "updated";
  updated_at: string;
}

export interface AdminClientProfileRequestListParams {
  page?: number;
  perPage?: number;
  status: "pending" | "updated";
  client_id?: number;
  client_no?: string;
  client_name?: string;
  email?: string;
}

/** GET /v1/client-profiles/{clientUpdate} → data.client_update (full ClientUpdate row). */
export interface AdminClientProfileRequestDetail {
  id: number;
  client_id: number;
  owner_name: string | null;
  owner_nic: string | null;
  owner_email: string | null;
  owner_phone_no: string | null;
  owner_address: string | null;
  advicer_name: string | null;
  name: string;
  business_reg_no: string | null;
  email: string;
  address: string | null;
  business_type: string[] | null;
  business_phone_no: string | null;
  status: boolean;
  approved_by: number | null;
  account_name: string;
  account_no: string;
  branch_name: string;
  bank_name: string;
  bank_id: string;
  pickup_address: string;
  pickup_phone_no: string;
  nearest_city: number;
  pickup_branch: string;
  payment_terms: string | null;
  verification_document_type: string | null;
  identity_document_front: string | null;
  identity_document_back: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * POST /v1/client-profiles/update/{clientUpdate} (UpdateClientProfileDTO) —
 * this both applies the change to the live Client record AND marks the
 * request approved; there is no separate reject endpoint on this controller.
 * `business_type` is deliberately omitted here — the DTO expects an array of
 * BusinessType *enum keys*, but `getClientProfile` returns an array of
 * human-readable *labels* for the same field, so round-tripping it back
 * verbatim would fail validation (or silently store the wrong thing if it
 * happened to pass). Every other field round-trips cleanly.
 */
export interface ApproveClientProfilePayload {
  owner_name?: string;
  owner_nic?: string;
  owner_email?: string;
  owner_phone_no?: string;
  owner_address?: string;
  advicer_name?: string;
  name: string;
  business_reg_no?: string;
  email: string;
  address?: string;
  business_phone_no?: string;
  account_name: string;
  account_no: string;
  branch_name: string;
  bank_name: string;
  bank_id: string;
  pick_address: string;
  pick_phone_no: string;
  nearest_city: number;
  pickup_branch: string;
  payment_terms?: string;
  verification_document_type?: string;
}
