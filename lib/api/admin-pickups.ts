import { api, get, queryParams } from "@/lib/api/client";
import type { PickupRequest } from "@/types/pickup";
import type { AdminPickupListParams } from "@/types/admin-pickup";

/**
 * GET /shipments/pickup-requests
 *
 * No limit/offset on this endpoint — it returns the whole filtered set, so the
 * list is not paged. That is fine at current volume and will not be forever;
 * paging it is a backend change, noted in docs/API-GAPS.md.
 */
export async function listPickupRequests(
  params: AdminPickupListParams = {}
): Promise<PickupRequest[]> {
  return get<PickupRequest[]>("/shipments/pickup-requests", {
    params: queryParams({ ...params }),
  });
}

/** GET /shipments/pickup-requests/{id} */
export async function getPickupRequest(
  pickupId: number | string
): Promise<PickupRequest> {
  return get<PickupRequest>(`/shipments/pickup-requests/${pickupId}`);
}

/** POST /shipments/pickup-requests/{id}/assign-rider */
export async function assignRiderToPickup(
  pickupId: number | string,
  riderId: number
): Promise<PickupRequest> {
  const { data } = await api.post<PickupRequest>(
    `/shipments/pickup-requests/${pickupId}/assign-rider`,
    { rider_id: riderId }
  );
  return data;
}

/** POST /shipments/pickup-requests/{id}/status */
export async function setPickupStatus(
  pickupId: number | string,
  status: string
): Promise<PickupRequest> {
  const { data } = await api.post<PickupRequest>(
    `/shipments/pickup-requests/${pickupId}/status`,
    { status }
  );
  return data;
}
