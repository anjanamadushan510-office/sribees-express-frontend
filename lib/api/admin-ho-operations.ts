import { api, unwrapPaginated } from "@/lib/api/client";
import type { ApiResponse, Paginated } from "@/types/api";
import type {
  HOClearanceListParams,
  HOClearanceRow,
  HOOrderListParams,
  HOOrderRow,
  ReversalHistoryListParams,
  ReversalHistoryRow,
} from "@/types/admin-ho-operations";

/** GET /api/v1/ho-operations/orders/list. */
export async function listHOOrders(params: HOOrderListParams): Promise<Paginated<HOOrderRow>> {
  const res = await api.get<ApiResponse<HOOrderRow[]>>("/v1/ho-operations/orders/list", {
    params: clean(params),
  });
  return unwrapPaginated<HOOrderRow>(res);
}

/** GET /api/v1/ho-operations/orders/clearance/list. */
export async function listHOClearance(
  params: HOClearanceListParams
): Promise<Paginated<HOClearanceRow>> {
  const res = await api.get<ApiResponse<HOClearanceRow[]>>(
    "/v1/ho-operations/orders/clearance/list",
    { params: clean(params) }
  );
  return unwrapPaginated<HOClearanceRow>(res);
}

/** GET /api/v1/ho-operations/orders/order-reversal-history/list. */
export async function listReversalHistory(
  params: ReversalHistoryListParams
): Promise<Paginated<ReversalHistoryRow>> {
  const res = await api.get<ApiResponse<ReversalHistoryRow[]>>(
    "/v1/ho-operations/orders/order-reversal-history/list",
    { params: clean(params) }
  );
  return unwrapPaginated<ReversalHistoryRow>(res);
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
