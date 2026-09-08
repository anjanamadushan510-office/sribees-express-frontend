import { api, pickKey, unwrap, unwrapPaginated } from "@/lib/api/client";
import type { ApiResponse, Paginated } from "@/types/api";
import type {
  AdminClientUserDetail,
  AdminClientUserRow,
  AdminClientUsersListParams,
  UpdateAdminClientUserPayload,
} from "@/types/admin-client-user";

/** GET /api/v1/client-users/list — staff-side client sub-user management. */
export async function listAdminClientUsers(
  params: AdminClientUsersListParams
): Promise<Paginated<AdminClientUserRow>> {
  const res = await api.get<ApiResponse<AdminClientUserRow[]>>("/v1/client-users/list", {
    params: clean(params),
  });
  return unwrapPaginated<AdminClientUserRow>(res);
}

/** GET /api/v1/client-users/{clientUser}. */
export async function getAdminClientUser(id: number | string): Promise<AdminClientUserDetail> {
  const res = await api.get<ApiResponse<unknown>>(`/v1/client-users/${id}`);
  const data = unwrap(res);
  const detail = pickKey<AdminClientUserDetail>(data, "client_user");
  if (!detail) throw new Error("Client user not found");
  return detail;
}

/** PUT /api/v1/client-users/update/{clientUser}. */
export async function updateAdminClientUser(
  id: number | string,
  payload: UpdateAdminClientUserPayload
): Promise<void> {
  await api.put(`/v1/client-users/update/${id}`, payload);
}

/** PUT /api/v1/client-users/status/update/{clientUser}. */
export async function toggleAdminClientUserStatus(
  id: number | string,
  isActive: boolean
): Promise<void> {
  await api.put(`/v1/client-users/status/update/${id}`, { is_active: isActive });
}

function clean<T extends object>(params: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out;
}
