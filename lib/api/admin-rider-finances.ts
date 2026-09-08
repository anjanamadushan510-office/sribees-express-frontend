import { api, pickKey, unwrap } from "@/lib/api/client";
import type { ApiResponse, Paginated } from "@/types/api";
import type {
  ApproveDepositPayload,
  MakePaymentPayload,
  RejectDepositPayload,
  RiderDepositListParams,
  RiderDepositListResult,
  RiderDepositRow,
  RiderDepositViewResult,
} from "@/types/admin-rider-finance";

/**
 * GET /api/v1/rider-finances/deposits — this module doesn't use the shared
 * `makePaginatedResponse` helper (custom `data.pagination` shape instead), so
 * `data` still goes through `convertToAPIData` and needs `pickKey`. The
 * pagination block uses different field names (`total_pages` instead of
 * `last_page`) — remapped here to the standard `Pagination` shape so the
 * shared `<Pagination>` component works unchanged.
 */
export async function listRiderDeposits(
  params: RiderDepositListParams
): Promise<Paginated<RiderDepositRow> & { summary: RiderDepositListResult["summary"] }> {
  const res = await api.get<ApiResponse<unknown>>("/v1/rider-finances/deposits", {
    params: clean(params),
  });
  const data = unwrap(res);
  const deposits = pickKey<RiderDepositRow[]>(data, "deposits") ?? [];
  const pagination = pickKey<RiderDepositListResult["pagination"]>(data, "pagination");
  const summary = pickKey<RiderDepositListResult["summary"]>(data, "summary");

  return {
    items: deposits,
    pagination: {
      total: pagination?.total ?? 0,
      per_page: pagination?.per_page ?? 20,
      current_page: pagination?.current_page ?? 1,
      last_page: pagination?.total_pages ?? 1,
    },
    summary: summary ?? {
      total_count: 0,
      pending_count: 0,
      deposited_count: 0,
      approved_count: 0,
      rejected_count: 0,
      total_amount: 0,
      pending_amount: 0,
      approved_amount: 0,
    },
  };
}

/** GET /api/v1/rider-finances/deposits/{id}. */
export async function getRiderDeposit(id: number | string): Promise<RiderDepositViewResult> {
  const res = await api.get<ApiResponse<unknown>>(`/v1/rider-finances/deposits/${id}`);
  const data = unwrap(res);
  const deposit = pickKey(data, "deposit");
  if (!deposit) throw new Error("Deposit not found");
  return {
    deposit,
    orders: pickKey(data, "orders") ?? [],
    actions: pickKey(data, "actions") ?? [],
  } as RiderDepositViewResult;
}

/**
 * POST /api/v1/rider-finances/deposits/{id}/make-payment (MakePaymentRequest).
 * Always sent as multipart/form-data since `payment_slip` (nullable file,
 * mimes jpeg/png/pdf, max 5MB) may be attached.
 */
export async function makeDepositPayment(
  id: number | string,
  payload: MakePaymentPayload
): Promise<void> {
  const form = new FormData();
  form.append("deposit_amount", String(payload.deposit_amount));
  form.append("payment_method", payload.payment_method);
  if (payload.transaction_number) form.append("transaction_number", payload.transaction_number);
  if (payload.payment_remarks) form.append("payment_remarks", payload.payment_remarks);
  if (payload.payment_slip) form.append("payment_slip", payload.payment_slip);

  await api.post(`/v1/rider-finances/deposits/${id}/make-payment`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

/** POST /api/v1/rider-finances/deposits/{id}/approve. */
export async function approveDeposit(
  id: number | string,
  payload: ApproveDepositPayload
): Promise<void> {
  await api.post(`/v1/rider-finances/deposits/${id}/approve`, payload);
}

/** POST /api/v1/rider-finances/deposits/{id}/reject. */
export async function rejectDeposit(
  id: number | string,
  payload: RejectDepositPayload
): Promise<void> {
  await api.post(`/v1/rider-finances/deposits/${id}/reject`, payload);
}

function clean<T extends object>(params: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    out[k] = v;
  }
  return out;
}
