/**
 * A row from GET /v1/branch-finances/branch-deposit/list (BranchDepositListAction).
 * Note the backend's own inconsistent casing on `Deposited_Date` — preserved as-is.
 */
export interface BranchDepositRow {
  id: number;
  Deposited_Date: string;
  deposit_amount: number | string;
  expenses: number | string;
  remarks: string | null;
  branch_name: string;
  remaining_amount: number | string;
  status: string | null;
  last_update: string;
}

export interface BranchDepositListParams {
  page?: number;
  perPage?: number;
  orderBy?: string;
  orderByDirection?: "asc" | "desc";
  dateRange?: string;
  branch_id?: number;
  status?: string[];
  expense_status?: "approved" | "rejected" | "pending";
  branch_name?: string;
}

/** GET /v1/branch-finances/branch-deposit/view/{id} → data (branchDeposit[0], expense_detail[], order_detail[]). */
export interface BranchDepositSummary {
  deposit_date: string;
  expenses: number | string;
  branch_name: string;
  remarks: string | null;
  total_collected_cod: number | string;
  waybill_ids: string | null;
  deposit_amount: number | string;
}

export interface BranchExpenseDetail {
  amount: number | string;
  expense_name: string;
}

export interface BranchDepositOrder {
  created_at: string;
  waybill_id: string;
  client_name: string;
  customer_name: string;
  address: string;
  phone_no: string;
  cod: number | string;
  collected_cod: number | string;
  delivery_charge: number | string;
  branch_name: string;
  city_name: string;
  district_name: string;
  rider_name: string | null;
  completed_date: string | null;
  status: string | null;
}

export interface BranchDepositViewResult {
  branchDeposit: BranchDepositSummary | null;
  mediaFileName: string;
  expense_detail: BranchExpenseDetail[];
  order_detail: BranchDepositOrder[];
}

/** GET /v1/branch-finances/branch-waybill-id?branch_id= (BranchWaybillListAction). */
export interface BranchWaybillOption {
  id: number;
  waybill_id: string;
}

/** POST /v1/branch-finances/branch-deposit/create (BranchDepositCreateDTO), multipart. */
export interface CreateBranchDepositPayload {
  branch_id: number;
  expenses: number;
  expense_type: number;
  waybill_ids: string[];
  remarks?: string;
  deposit_date?: string;
  deposit_file?: File;
}

/** GET /v1/branch-finances/branch-deposit/edit/{id} (BranchDepositEditAction) → data. */
export interface BranchDepositEditInfo {
  approved_expenses: { expense_id: number; amount: number; expense_type: string }[];
  pending_expenses: {
    created_at: string;
    branch_deposit_id: number;
    amount: number;
    status: string;
    expense_type: string;
    expense_id: number;
  }[];
  total_amount: number;
  latest_remark: string;
  latest_file: string;
}

/** PUT /v1/branch-finances/branch-deposit/update/{id} (BranchDepositUpdateDTO), multipart. */
export interface UpdateBranchDepositPayload {
  addMoreInputFields: { expense_id: number; amount: number }[];
  remarks?: string;
  deposit_file?: File;
}

/** GET /v1/branch-finances/accept-payment/view/{id} (AcceptPaymentView) → data. */
export interface AcceptPaymentViewInfo {
  branch_deposit_id: number;
  today_date: string;
}

/** POST /v1/branch-finances/accept-payment/{id} (AcceptPaymentDTO). */
export interface AcceptPaymentPayload {
  payment_date: string;
  deposit_type: "Bank Deposit (HNB)" | "Bank Deposit (Sampath)";
}

/**
 * A row from GET /v1/branch-finances/approve-branch-expense/list
 * (ApproveBranchExpense) — pending expense-update requests grouped by deposit.
 */
export interface BranchExpenseApprovalRow {
  requested_date: string;
  deposit_id: number;
  status: string;
  branch: string;
  expenses_total: number;
}

export interface BranchExpenseApprovalListParams {
  page?: number;
  perPage?: number;
  expense_status: "pending" | "rejected" | "approved";
  branch_name?: string;
}

/** GET /v1/branch-finances/approve-expense/view/{id}?expense_status= (DepositUpdateView) → data. */
export interface BranchExpenseUpdateDetail {
  results: { amount: number; expense_type: string }[];
  total_amount: number;
  latest_remark: string;
}
