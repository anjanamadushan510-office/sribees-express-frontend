import { get, queryParams, range, toPage } from "@/lib/api/client";
import type { ListRange, Page } from "@/types/api";
import type {
  ClientOrder,
  ClientOrdersListParams,
  CreateClientOrderPayload,
  OrderHistoryEntry,
} from "@/types/order";
import { api } from "@/lib/api/client";

/**
 * GET /client-portal/orders — the signed-in client's shipments.
 *
 * Scoping is server-side: the endpoint derives the client from the token, so
 * there is no client_id parameter to pass (and no way for the browser to ask
 * for someone else's orders).
 */
export async function listClientOrders(
  params: ClientOrdersListParams = {}
): Promise<Page<ClientOrder>> {
  const paging = range(params);
  const items = await get<ClientOrder[]>("/client-portal/orders", {
    params: queryParams({ status_key: params.status_key, ...paging }),
  });
  return toPage(items, paging);
}

/** GET /client-portal/orders/{id} */
export async function getClientOrder(id: number | string): Promise<ClientOrder> {
  return get<ClientOrder>(`/client-portal/orders/${id}`);
}

/** GET /client-portal/orders/{id}/history — status transitions, oldest first. */
export async function getClientOrderHistory(
  id: number | string
): Promise<OrderHistoryEntry[]> {
  return get<OrderHistoryEntry[]>(`/client-portal/orders/${id}/history`);
}

/** POST /client-portal/orders — returns the created order, not just a status. */
export async function createClientOrder(
  payload: CreateClientOrderPayload
): Promise<ClientOrder> {
  const { data } = await api.post<ClientOrder>("/client-portal/orders", payload);
  return data;
}

/**
 * GET /client-portal/api/orders/track/{waybill_id} — public-ish tracking by
 * waybill. Unlike the endpoints above this is keyed by waybill rather than
 * internal id, which is what a recipient actually has.
 */
export async function trackByWaybill(waybillId: string): Promise<ClientOrder> {
  return get<ClientOrder>(
    `/client-portal/api/orders/track/${encodeURIComponent(waybillId)}`
  );
}

/** Re-exported so list screens can share one page size. */
export type { ListRange };
