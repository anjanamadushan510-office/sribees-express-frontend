import { api, get, queryParams, range, toPage } from "@/lib/api/client";
import type { Page } from "@/types/api";
import type { CreatePickupPayload, PickupListParams, PickupRequest } from "@/types/pickup";

/** GET /client-portal/pickup-requests — scoped to the signed-in client. */
export async function listClientPickups(
  params: PickupListParams = {}
): Promise<Page<PickupRequest>> {
  const paging = range(params);
  const items = await get<PickupRequest[]>("/client-portal/pickup-requests", {
    params: queryParams({ ...paging }),
  });
  return toPage(items, paging);
}

/** POST /client-portal/pickup-requests */
export async function createClientPickup(
  payload: CreatePickupPayload
): Promise<PickupRequest> {
  const { data } = await api.post<PickupRequest>(
    "/client-portal/pickup-requests",
    payload
  );
  return data;
}

/**
 * Cancelling a pickup request has no endpoint on this backend. The Laravel API
 * had `client-pickup-request/cancel`; nothing equivalent is exposed yet, so
 * the UI must not offer a cancel action that would 404. Tracked in
 * docs/API-GAPS.md.
 */
