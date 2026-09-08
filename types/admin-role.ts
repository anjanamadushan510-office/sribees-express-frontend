/** A row from GET /api/v1/role/list (raw `roles` table row). */
export interface RoleRow {
  id: number;
  name: string;
  guard_name: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface RoleListParams {
  page?: number;
  perPage?: number;
  orderBy?: string;
  orderByDirection?: "asc" | "desc";
  name?: string;
}

/** GET /api/v1/role/{role} → data (id, name, permissions[]). */
export interface RoleDetail {
  id: number;
  name: string;
  permissions: { id: number; name: string }[];
}

/** GET /api/v1/role/permissions-categories → data[] (bypasses the envelope helper). */
export interface PermissionCategory {
  id: number;
  name: string;
  permissions: { id: number; key: string; name: string }[];
}

/** Payload for POST /api/v1/role/create. */
export interface CreateRolePayload {
  name: string;
  permission_ids: number[];
}

/** Payload for PUT /api/v1/role/update/{role}. */
export interface UpdateRolePayload {
  permission_ids: number[];
}
