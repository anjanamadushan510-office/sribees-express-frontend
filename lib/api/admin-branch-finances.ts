import { api, pickKey, unwrap, unwrapPaginated } from "@/lib/api/client";
import type { ApiResponse, Paginated } from "@/types/api";
import type {
  AcceptPaymentPayload,
  AcceptPaymentViewInfo,
  BranchDepositEditInfo,
  BranchDepositListParams,
  BranchDepositRow,
  BranchDepositSummary,
  BranchDepositViewResult,
  BranchExpenseApprovalListParams,
  BranchExpenseApprovalRow,
  BranchExpenseUpdateDetail,
  BranchWaybillOption,
  CreateBranchDepositPayload,
  UpdateBranchDepositPayload,
} from "@/types/admin-branch-finance";

/**
 * GET /api/v1/branch-finances/branch-deposit/list — scoped to this scope's
 * implemented subset: list, view, approve, reject. Deposit creation/edit and
 * the separate expense-approval sub-workflow (`approve-branch-expense/list`,
 * `approve-expense/{id}`, `reject-expense/{id}`) are not wired — out of scope
 * for tonight, see BUILD_LOG.md.
 */
export async function listBranchDeposits(
  params: BranchDepositListParams
): Promise<Paginated<BranchDepositRow>> {
  const res = await api.get<ApiResponse<BranchDepositRow[]>>(
    "/v1/branch-finances/branch-deposit/list",
    { params: clean(params) }
  );
  return unwrapPaginated<BranchDepositRow>(res);
}

/** GET /api/v1/branch-finances/branch-deposit/view/{id}. */
export async function getBranchDeposit(id: number | string): Promise<BranchDepositViewResult> {
  const res = await api.get<ApiResponse<unknown>>(
    `/v1/branch-finances/branch-deposit/view/${id}`
  );
  const data = unwrap(res);
  const rows = pickKey<BranchDepositSummary[]>(data, "branchDeposit") ?? [];
  return {
    branchDeposit: rows[0] ?? null,
    mediaFileName: pickKey<string>(data, "mediaFileName") ?? "",
    expense_detail: pickKey(data, "expense_detail") ?? [],
    order_detail: pickKey(data, "order_detail") ?? [],
  };
}

/** POST /api/v1/branch-finances/approve-deposit/{branchDeposit} — no request body. */
export async function approveBranchDeposit(id: number | string): Promise<void> {
  await api.post(`/v1/branch-finances/approve-deposit/${id}`);
}

/** POST /api/v1/branch-finances/reject-deposit/{branchDeposit} — no request body. */
export async function rejectBranchDeposit(id: number | string): Promise<void> {
  await api.post(`/v1/branch-finances/reject-deposit/${id}`);
}

/** GET /v1/branch-finances/branch-waybill-id?branch_id= — deposit-eligible waybills for a branch. */
export async function getBranchWaybillOptions(
  branchId: number | string
): Promise<BranchWaybillOption[]> {
  const res = await api.get<ApiResponse<unknown>>("/v1/branch-finances/branch-waybill-id", {
    params: { branch_id: branchId },
  });
  const data = unwrap(res);
  return pickKey<BranchWaybillOption[]>(data, "results") ?? [];
}

/** POST /v1/branch-finances/branch-deposit/create — multipart (deposit_file). */
export async function createBranchDeposit(payload: CreateBranchDepositPayload): Promise<void> {
  const form = new FormData();
  form.append("branch_id", String(payload.branch_id));
  form.append("expenses", String(payload.expenses));
  form.append("expense_type", String(payload.expense_type));
  payload.waybill_ids.forEach((w, i) => form.append(`waybill_ids[${i}]`, w));
  if (payload.remarks) form.append("remarks", payload.remarks);
  if (payload.deposit_date) form.append("deposit_date", payload.deposit_date);
  if (payload.deposit_file) form.append("deposit_file", payload.deposit_file);

  await api.post("/v1/branch-finances/branch-deposit/create", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

/** GET /v1/branch-finances/branch-deposit/edit/{id}. */
export async function getBranchDepositEditInfo(
  id: number | string
): Promise<BranchDepositEditInfo> {
  const res = await api.get<ApiResponse<BranchDepositEditInfo>>(
    `/v1/branch-finances/branch-deposit/edit/${id}`
  );
  return unwrap(res);
}

/** PUT /v1/branch-finances/branch-deposit/update/{id} — multipart (deposit_file). */
export async function updateBranchDeposit(
  id: number | string,
  payload: UpdateBranchDepositPayload
): Promise<void> {
  const form = new FormData();
  payload.addMoreInputFields.forEach((f, i) => {
    form.append(`addMoreInputFields[${i}][expense_id]`, String(f.expense_id));
    form.append(`addMoreInputFields[${i}][amount]`, String(f.amount));
  });
  if (payload.remarks) form.append("remarks", payload.remarks);
  if (payload.deposit_file) form.append("deposit_file", payload.deposit_file);

  await api.put(`/v1/branch-finances/branch-deposit/update/${id}`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

/** GET /v1/branch-finances/accept-payment/view/{id}. */
export async function getAcceptPaymentView(
  id: number | string
): Promise<AcceptPaymentViewInfo> {
  const res = await api.get<ApiResponse<AcceptPaymentViewInfo>>(
    `/v1/branch-finances/accept-payment/view/${id}`
  );
  return unwrap(res);
}

/** POST /v1/branch-finances/accept-payment/{id}. */
export async function acceptBranchDepositPayment(
  id: number | string,
  payload: AcceptPaymentPayload
): Promise<void> {
  await api.post(`/v1/branch-finances/accept-payment/${id}`, payload);
}

/** GET /v1/branch-finances/approve-branch-expense/list — pending expense-update requests. */
export async function listBranchExpenseApprovals(
  params: BranchExpenseApprovalListParams
): Promise<Paginated<BranchExpenseApprovalRow>> {
  const res = await api.get<ApiResponse<BranchExpenseApprovalRow[]>>(
    "/v1/branch-finances/approve-branch-expense/list",
    { params: clean(params) }
  );
  return unwrapPaginated<BranchExpenseApprovalRow>(res);
}

/** GET /v1/branch-finances/approve-expense/view/{id}?expense_status=. */
export async function getBranchExpenseUpdateDetail(
  depositId: number | string,
  expenseStatus: "pending" | "rejected" | "approved" = "pending"
): Promise<BranchExpenseUpdateDetail> {
  const res = await api.get<ApiResponse<BranchExpenseUpdateDetail>>(
    `/v1/branch-finances/approve-expense/view/${depositId}`,
    { params: { expense_status: expenseStatus } }
  );
  return unwrap(res);
}

/** POST /v1/branch-finances/approve-expense/{id} — no request body. */
export async function approveBranchExpense(id: number | string): Promise<void> {
  await api.post(`/v1/branch-finances/approve-expense/${id}`);
}

/** POST /v1/branch-finances/reject-expense/{id} — no request body. */
export async function rejectBranchExpense(id: number | string): Promise<void> {
  await api.post(`/v1/branch-finances/reject-expense/${id}`);
}

function clean<T extends object>(params: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out;
}
