import { api, pickKey, unwrap, unwrapPaginated } from "@/lib/api/client";
import type { ApiResponse, Paginated } from "@/types/api";
import type {
  CreateRolePayload,
  PermissionCategory,
  RoleDetail,
  RoleListParams,
  RoleRow,
  UpdateRolePayload,
} from "@/types/admin-role";

/** GET /api/v1/role/list — paginated staff-guard roles. */
export async function listRoles(params: RoleListParams): Promise<Paginated<RoleRow>> {
  const res = await api.get<ApiResponse<RoleRow[]>>("/v1/role/list", {
    params: clean(params),
  });
  return unwrapPaginated<RoleRow>(res);
}

/**
 * GET /api/v1/role/{role} — the controller returns `data` as a bare
 * associative array `{ id, name, permissions }` (not nested under a named
 * key), so the envelope helper still reshapes it into `[{key,value}]` pairs;
 * pull each field out by key.
 */
export async function getRole(id: number | string): Promise<RoleDetail> {
  const res = await api.get<ApiResponse<unknown>>(`/v1/role/${id}`);
  const data = unwrap(res);
  const roleId = pickKey<number>(data, "id");
  const name = pickKey<string>(data, "name");
  if (roleId == null || name == null) throw new Error("Role not found");
  return {
    id: roleId,
    name,
    permissions: pickKey(data, "permissions") ?? [],
  };
}

/**
 * GET /api/v1/role/permissions-categories — this controller method returns
 * `response()->json([...])` directly, bypassing `APIHelper::makeAPIResponse`
 * entirely, so `data` is the raw category array (no `convertToAPIData` reshape).
 */
export async function getPermissionCategories(): Promise<PermissionCategory[]> {
  const res = await api.get<ApiResponse<PermissionCategory[]>>(
    "/v1/role/permissions-categories"
  );
  return unwrap<PermissionCategory[]>(res) ?? [];
}

/** POST /api/v1/role/create. */
export async function createRole(payload: CreateRolePayload): Promise<void> {
  await api.post("/v1/role/create", payload);
}

/** PUT /api/v1/role/update/{role} — permissions only; role name can't be changed after creation. */
export async function updateRole(
  id: number | string,
  payload: UpdateRolePayload
): Promise<void> {
  await api.put(`/v1/role/update/${id}`, payload);
}

function clean(params: RoleListParams): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    out[k] = v;
  }
  return out;
}
