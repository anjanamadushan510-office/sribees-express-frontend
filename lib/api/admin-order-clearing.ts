import { api, unwrapPaginated } from "@/lib/api/client";
import type { ApiResponse, Paginated } from "@/types/api";
import type {
  AllOrderClearListParams,
  AllOrderClearRow,
  TodayOrderClearListParams,
  TodayOrderClearRow,
} from "@/types/admin-order-clearing";

/** GET /api/v1/order-clearing/today-order-clear/list. */
export async function listTodayOrderClear(
  params: TodayOrderClearListParams
): Promise<Paginated<TodayOrderClearRow>> {
  const res = await api.get<ApiResponse<TodayOrderClearRow[]>>(
    "/v1/order-clearing/today-order-clear/list",
    { params: clean(params) }
  );
  return unwrapPaginated<TodayOrderClearRow>(res);
}

/** GET /api/v1/order-clearing/all-order-clear/list. */
export async function listAllOrderClear(
  params: AllOrderClearListParams
): Promise<Paginated<AllOrderClearRow>> {
  const res = await api.get<ApiResponse<AllOrderClearRow[]>>(
    "/v1/order-clearing/all-order-clear/list",
    { params: clean(params) }
  );
  return unwrapPaginated<AllOrderClearRow>(res);
}

/** PUT /api/v1/order-clearing/manifesto-order-clearing-today/update — mark a waybill cleared (today's list). */
export async function clearTodayOrder(waybillId: string): Promise<void> {
  await api.put("/v1/order-clearing/manifesto-order-clearing-today/update", {
    waybill_id: waybillId,
  });
}

/** PUT /api/v1/order-clearing/manifesto-order-clearing-all/update — mark a waybill cleared (all-time). */
export async function clearAllOrder(waybillId: string): Promise<void> {
  await api.put("/v1/order-clearing/manifesto-order-clearing-all/update", {
    waybill_id: waybillId,
  });
}

function clean<T extends object>(params: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    out[k] = v;
  }
  return out;
}
