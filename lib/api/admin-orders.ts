import { api, pickKey, unwrap, unwrapPaginated } from "@/lib/api/client";
import type { ApiResponse, Paginated } from "@/types/api";
import type {
  AdminOrderFullDetail,
  AdminOrderRow,
  AdminOrdersListParams,
  CreateAdminOrderManualWaybillPayload,
  CreateAdminOrderPayload,
  CreateOrderRemarkPayload,
  UpdateOrderStatusPayload,
} from "@/types/admin-order";

/** GET /api/v1/orders/list — paginated, staff-wide order list (auth:staff, view-orders). */
export async function listAdminOrders(
  params: AdminOrdersListParams
): Promise<Paginated<AdminOrderRow>> {
  const res = await api.get<ApiResponse<AdminOrderRow[]>>("/v1/orders/list", {
    params: serializeParams(params),
  });
  return unwrapPaginated<AdminOrderRow>(res);
}

/**
 * GET /api/v1/orders/{order} — full order detail (order_details, order_remarks,
 * tracking_history, reversal_history). `order` is the numeric orders.id.
 */
export async function getAdminOrder(id: number | string): Promise<AdminOrderFullDetail> {
  const res = await api.get<ApiResponse<unknown>>(`/v1/orders/${id}`);
  const data = unwrap(res);
  const detailRows = pickKey<Record<string, unknown>[]>(data, "order_details") ?? [];
  return {
    order_details:
      (detailRows[0] as unknown as AdminOrderFullDetail["order_details"]) ?? null,
    order_remarks: pickKey(data, "order_remarks") ?? [],
    tracking_history: pickKey(data, "tracking_history") ?? [],
    reversal_history: pickKey(data, "reversal_history") ?? [],
  };
}

/** POST /api/v1/orders/create-auto-waybill — create a single order, backend-assigned waybill. */
export async function createAdminOrder(payload: CreateAdminOrderPayload): Promise<void> {
  await api.post("/v1/orders/create-auto-waybill", payload);
}

/**
 * POST /api/v1/orders/create — create a single order with a manually supplied
 * waybill number (SingleOrderManualWaybillDTO). Requires the `create-orders`
 * permission, same as the auto-waybill variant.
 */
export async function createAdminOrderManualWaybill(
  payload: CreateAdminOrderManualWaybillPayload
): Promise<void> {
  await api.post("/v1/orders/create", payload);
}

/** POST /api/v1/orders/status-update — advance/change an order's status. */
export async function updateAdminOrderStatus(
  payload: UpdateOrderStatusPayload
): Promise<void> {
  await api.post("/v1/orders/status-update", payload);
}

/** POST /api/v1/orders/order-remarks/create — attach an internal remark to an order. */
export async function createAdminOrderRemark(
  payload: CreateOrderRemarkPayload
): Promise<void> {
  await api.post("/v1/orders/order-remarks/create", payload);
}

/** PUT /api/v1/orders/hold/{order} — toggle hold status on an order. */
export async function holdAdminOrder(id: number | string): Promise<void> {
  await api.put(`/v1/orders/hold/${id}`);
}

function serializeParams(params: AdminOrdersListParams): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value) && value.length === 0) continue;
    out[key] = value;
  }
  return out;
}
