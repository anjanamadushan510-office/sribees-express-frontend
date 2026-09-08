import { api, pickKey, unwrap, unwrapPaginated } from "@/lib/api/client";
import type { ApiResponse, Paginated } from "@/types/api";
import type {
  ClientOrderDetail,
  ClientOrderRow,
  ClientOrdersListParams,
  CreateClientOrderPayload,
  OrderTrackEntry,
} from "@/types/order";

/** GET /api/v1/client-orders/list — paginated shipment history for the signed-in client. */
export async function listClientOrders(
  params: ClientOrdersListParams
): Promise<Paginated<ClientOrderRow>> {
  const res = await api.get<ApiResponse<ClientOrderRow[]>>(
    "/v1/client-orders/list",
    { params: serializeParams(params) }
  );
  return unwrapPaginated<ClientOrderRow>(res);
}

/** GET /api/v1/client-orders/{order} — full order detail. */
export async function getClientOrder(id: number | string): Promise<ClientOrderDetail> {
  const res = await api.get<ApiResponse<unknown>>(`/v1/client-orders/${id}`);
  const detail = pickKey<ClientOrderDetail>(unwrap(res), "order_details");
  if (!detail) throw new Error("Order not found");
  return detail;
}

/** GET /api/v1/client-orders/tracking/{order} — tracking history (oldest-first). */
export async function trackClientOrder(
  id: number | string
): Promise<OrderTrackEntry[]> {
  const res = await api.get<ApiResponse<unknown>>(`/v1/client-orders/tracking/${id}`);
  return pickKey<OrderTrackEntry[]>(unwrap(res), "tracking_history") ?? [];
}

/** POST /api/v1/client-orders/create — create a single shipment. */
export async function createClientOrder(
  payload: CreateClientOrderPayload
): Promise<void> {
  await api.post("/v1/client-orders/create", payload);
}

/**
 * Axios serialises array params as `statuses[]=...`. The Laravel DTO expects
 * a real array, which `statuses[]` satisfies; we just drop empty values.
 */
function serializeParams(params: ClientOrdersListParams): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value) && value.length === 0) continue;
    out[key] = value;
  }
  return out;
}
