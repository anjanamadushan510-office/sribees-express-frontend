import { api, get, queryParams } from "@/lib/api/client";
import type {
  DispatchAssignRequest,
  DispatchAssignResult,
  DispatchPickup,
  DispatchPickupParams,
  DispatchPostalCity,
} from "@/types/admin-dispatch";

/**
 * The pickup dispatch board (`/fleet/dispatch`).
 *
 * Parcels are grouped by the postal city of the outlet they are collected
 * from, so a dispatcher picks an area and hands its parcels to one rider.
 * Assigning is all-or-nothing on the server: one parcel that is no longer
 * assignable fails the whole batch rather than half-dispatching an area.
 */

/** GET /fleet/dispatch/pickup-postal-cities */
export const listPickupPostalCities = () =>
  get<DispatchPostalCity[]>("/fleet/dispatch/pickup-postal-cities");

/** GET /fleet/dispatch/pickups */
export const listDispatchPickups = (params: DispatchPickupParams = {}) =>
  get<DispatchPickup[]>("/fleet/dispatch/pickups", {
    params: queryParams({ ...params }),
  });

/** POST /fleet/dispatch/pickups/assign */
export async function assignDispatchPickups(
  payload: DispatchAssignRequest
): Promise<DispatchAssignResult> {
  const { data } = await api.post<DispatchAssignResult>(
    "/fleet/dispatch/pickups/assign",
    payload
  );
  return data;
}
