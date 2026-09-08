import { api, pickKey, unwrap, unwrapPaginated } from "@/lib/api/client";
import type { ApiResponse, Paginated } from "@/types/api";
import type {
  AdminClientProfileRequestDetail,
  AdminClientProfileRequestListParams,
  AdminClientProfileRequestRow,
  ApproveClientProfilePayload,
} from "@/types/admin-client-profile";

/** GET /api/v1/client-profiles/list — profile-update-request review queue. */
export async function listAdminClientProfileRequests(
  params: AdminClientProfileRequestListParams
): Promise<Paginated<AdminClientProfileRequestRow>> {
  const res = await api.get<ApiResponse<AdminClientProfileRequestRow[]>>(
    "/v1/client-profiles/list",
    { params: clean(params) }
  );
  return unwrapPaginated<AdminClientProfileRequestRow>(res);
}

/** GET /api/v1/client-profiles/{clientUpdate}. */
export async function getAdminClientProfileRequest(
  id: number | string
): Promise<AdminClientProfileRequestDetail> {
  const res = await api.get<ApiResponse<unknown>>(`/v1/client-profiles/${id}`);
  const data = unwrap(res);
  const detail = pickKey<AdminClientProfileRequestDetail>(data, "client_update");
  if (!detail) throw new Error("Profile update request not found");
  return detail;
}

/**
 * POST /api/v1/client-profiles/update/{clientUpdate} — approves the request
 * by re-applying its (possibly edited) fields onto the live client record.
 */
export async function approveAdminClientProfileRequest(
  id: number | string,
  payload: ApproveClientProfilePayload
): Promise<void> {
  await api.post(`/v1/client-profiles/update/${id}`, payload);
}

function clean<T extends object>(params: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    out[k] = v;
  }
  return out;
}
