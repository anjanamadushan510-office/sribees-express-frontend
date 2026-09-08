import { api, unwrapPaginated } from "@/lib/api/client";
import type { ApiResponse, Paginated } from "@/types/api";
import type {
  AdminPickupListParams,
  AdminPickupRow,
  AssignRiderPayload,
  CancelOrFailPickupPayload,
  PickupRequestIdsPayload,
} from "@/types/admin-pickup";

/** GET /api/v1/pickup-request/list — paginated, staff-wide pickup request list. */
export async function listAdminPickups(
  params: AdminPickupListParams
): Promise<Paginated<AdminPickupRow>> {
  const res = await api.get<ApiResponse<AdminPickupRow[]>>("/v1/pickup-request/list", {
    params: clean(params),
  });
  return unwrapPaginated<AdminPickupRow>(res);
}

/** POST /api/v1/pickup-request/assign-rider. */
export async function assignPickupRider(payload: AssignRiderPayload): Promise<void> {
  await api.post("/v1/pickup-request/assign-rider", payload);
}

/** POST /api/v1/pickup-request/branch-received. */
export async function receivePickupAtBranch(
  payload: PickupRequestIdsPayload
): Promise<void> {
  await api.post("/v1/pickup-request/branch-received", payload);
}

/** POST /api/v1/pickup-request/cancel-pickup. */
export async function cancelAdminPickup(payload: CancelOrFailPickupPayload): Promise<void> {
  await api.post("/v1/pickup-request/cancel-pickup", payload);
}

/** POST /api/v1/pickup-request/fail-pickup. */
export async function failAdminPickup(payload: CancelOrFailPickupPayload): Promise<void> {
  await api.post("/v1/pickup-request/fail-pickup", payload);
}

function clean(params: AdminPickupListParams): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    out[k] = v;
  }
  return out;
}
