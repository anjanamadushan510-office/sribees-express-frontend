export interface DepositStatus {
  name: "pending" | "deposited" | "approved" | "rejected" | string;
  label: string;
  color: string;
}

/** One row of GET /v1/rider-finances/deposits → data.deposits[] (RiderDepositListAction). */
export interface RiderDepositRow {
  id: number;
  reference_no: string;
  rider: { id: number; name: string; email: string; contact_no: string };
  branch: { id: number; name: string } | null;
  collected_cod_amount: number | string;
  deposit_amount: number | string;
  deposit_date: string | null;
  waybill_ids: string[] | string | null;
  payment_method: string | null;
  transaction_number: string | null;
  status: DepositStatus;
  is_manually_created: boolean;
  creator: string | null;
  approved_by: string | null;
  rejected_by: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  created_at: string;
  updated_at: string;
  actions: ("view_details" | "make_payment" | "approve" | "reject" | "print_deposit" | "view_remarks")[];
}

/** data.pagination — a bespoke shape, NOT the standard `Pagination` envelope block. */
export interface RiderDepositPaginationRaw {
  current_page: number;
  total_pages: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface RiderDepositSummary {
  total_count: number;
  pending_count: number;
  deposited_count: number;
  approved_count: number;
  rejected_count: number;
  total_amount: number | string;
  pending_amount: number | string;
  approved_amount: number | string;
}

export interface RiderDepositListResult {
  deposits: RiderDepositRow[];
  pagination: RiderDepositPaginationRaw;
  summary: RiderDepositSummary;
}

export interface RiderDepositListParams {
  page?: number;
  per_page?: number;
  rider_id?: number;
  status?: "pending" | "deposited" | "approved" | "rejected";
  start_date?: string;
  end_date?: string;
  branch_id?: number;
  search?: string;
  sort_by?: "created_at" | "reference_no" | "rider_name" | "status";
  sort_direction?: "asc" | "desc";
}

/** GET /v1/rider-finances/deposits/{id} → data.deposit (RiderDepositViewAction). */
export interface RiderDepositDetail {
  id: number;
  reference_no: string;
  rider: {
    id: number;
    name: string;
    email: string;
    contact_no: string;
    nic: string;
    address: string;
  };
  branch: { id: number; name: string; address: string } | null;
  amounts: { collected_cod_amount: number | string; deposit_amount: number | string };
  dates: {
    deposit_date: string | null;
    created_at: string;
    updated_at: string;
    approved_at: string | null;
    rejected_at: string | null;
  };
  waybill_ids: string[] | string | null;
  payment: {
    method: string | null;
    transaction_number: string | null;
    remarks: string | null;
    slip_url: string | null;
  };
  approval: {
    approve_remarks: string | null;
    reject_reason: string | null;
    approved_by: string | null;
    rejected_by: string | null;
  };
  status: {
    current: DepositStatus;
    history: { name: string; reason: string | null; created_at: string }[];
  };
  flags: {
    is_manually_created: boolean;
    can_be_edited_by_rider: boolean;
    is_pending: boolean;
    is_deposited: boolean;
    is_approved: boolean;
    is_rejected: boolean;
  };
  metadata: { created_by: string | null };
}

export interface RiderDepositOrder {
  id: number;
  waybill_id: string;
  collected_cod: number | string;
  customer_name: string;
  address: string;
  phone_no: string;
}

export interface RiderDepositViewResult {
  deposit: RiderDepositDetail;
  orders: RiderDepositOrder[];
  actions: string[];
}

/**
 * Payload for POST /v1/rider-finances/deposits/{id}/make-payment
 * (MakePaymentRequest). `transaction_number` is effectively required by the
 * backend whenever `payment_method` isn't `cash`/`other`. `payment_slip` is
 * optional (jpeg/png/pdf, max 5MB); sent as multipart/form-data.
 */
export interface MakePaymentPayload {
  deposit_amount: number;
  payment_method: "cash" | "bank_transfer" | "cheque" | "card" | "digital_wallet" | "other";
  transaction_number?: string;
  payment_remarks?: string;
  payment_slip?: File;
}

export interface ApproveDepositPayload {
  approve_remarks?: string;
}

export interface RejectDepositPayload {
  reject_reason: string;
}
