import { api, get, queryParams, range, toPage } from "@/lib/api/client";
import type { Page } from "@/types/api";
import type { ClientOrder, OrderHistoryEntry } from "@/types/order";
import type { AdminOrdersListParams, OrderStatusTransition } from "@/types/admin-order";

/** GET /shipments/orders — every client's orders, optionally filtered. */
export async function listOrders(
  params: AdminOrdersListParams = {}
): Promise<Page<ClientOrder>> {
  const paging = range(params);
  const items = await get<ClientOrder[]>("/shipments/orders", {
    params: queryParams({
      client_id: params.client_id,
      status_key: params.status_key,
      ...paging,
    }),
  });
  return toPage(items, paging);
}

/** GET /shipments/orders/{id} */
export async function getOrder(orderId: number | string): Promise<ClientOrder> {
  return get<ClientOrder>(`/shipments/orders/${orderId}`);
}

/** GET /shipments/orders/by-waybill/{waybill} — the staff waybill lookup. */
export async function getOrderByWaybill(waybillId: string): Promise<ClientOrder> {
  return get<ClientOrder>(
    `/shipments/orders/by-waybill/${encodeURIComponent(waybillId)}`
  );
}

/** GET /shipments/orders/{id}/history */
export async function getOrderHistory(
  orderId: number | string
): Promise<OrderHistoryEntry[]> {
  return get<OrderHistoryEntry[]>(`/shipments/orders/${orderId}/history`);
}

/**
 * POST /shipments/orders/{id}/status — move an order through the state machine.
 *
 * The backend validates the transition against its edge graph and rejects an
 * illegal one, so the UI does not need to replicate that graph; surface the
 * 4xx instead. Duplicating the rules here is how the two drift apart.
 */
export async function transitionOrderStatus(
  orderId: number | string,
  payload: OrderStatusTransition
): Promise<ClientOrder> {
  const { data } = await api.post<ClientOrder>(
    `/shipments/orders/${orderId}/status`,
    payload
  );
  return data;
}
