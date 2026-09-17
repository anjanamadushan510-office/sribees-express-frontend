import { api, get } from "@/lib/api/client";
import type { Rider, RiderBranchAssign, RiderBranches, RiderLocation } from "@/types/admin-rider";
import type { ClientOrder } from "@/types/order";

/** GET /fleet/riders */
export async function listRiders(): Promise<Rider[]> {
  return get<Rider[]>("/fleet/riders");
}

/** GET /fleet/riders/{id} */
export async function getRider(riderId: number | string): Promise<Rider> {
  return get<Rider>(`/fleet/riders/${riderId}`);
}

/**
 * GET /fleet/riders/{id}/location — last known position.
 *
 * Returns null on 404 rather than throwing: a rider who has never sent a ping
 * is a normal state, not an error, and the map should say "no location yet".
 */
export async function getRiderLocation(
  riderId: number | string
): Promise<RiderLocation | null> {
  try {
    return await get<RiderLocation>(`/fleet/riders/${riderId}/location`);
  } catch {
    return null;
  }
}

/** POST /fleet/orders/{id}/assign-rider — returns the updated order. */
export async function assignRiderToOrder(
  orderId: number | string,
  riderId: number
): Promise<ClientOrder> {
  const { data } = await api.post<ClientOrder>(
    `/fleet/orders/${orderId}/assign-rider`,
    { rider_id: riderId }
  );
  return data;
}

/** GET /fleet/riders/{id}/branches */
export async function getRiderBranches(riderId: number): Promise<RiderBranches> {
  return get<RiderBranches>(`/fleet/riders/${riderId}/branches`);
}

/** POST /fleet/riders/{id}/branches — add (or, with `detach: true`, remove) branches. */
export async function assignBranchesToRider(
  riderId: number,
  payload: RiderBranchAssign
): Promise<{ updated: number }> {
  const { data } = await api.post<{ updated: number }>(
    `/fleet/riders/${riderId}/branches`,
    payload
  );
  return data;
}
