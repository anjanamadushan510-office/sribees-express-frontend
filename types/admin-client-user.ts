/**
 * A row from GET /v1/client-users/list (ClientUserListAction, staff-side,
 * `view-client-user` permission). Sub-user accounts that log into the
 * customer portal on behalf of a client.
 */
export interface AdminClientUserRow {
  id: number;
  client_name: string;
  client_username: string;
  role_name: string | null;
  nic: string | null;
  address: string | null;
  email: string;
  contact_no: string | null;
  status: "new" | "active" | "deactivated" | string;
}

export interface AdminClientUsersListParams {
  page?: number;
  perPage?: number;
  orderBy?:
    | "client_name"
    | "client_number"
    | "client_username"
    | "email"
    | "status"
    | "pickup_branch"
    | "role_name"
    | "created_at";
  orderByDirection?: "asc" | "desc";
  status?: ("new" | "active" | "deactivated")[];
  client_username?: string;
  client_name?: string;
  email?: string;
}

/** GET /v1/client-users/{clientUser} → data.client_user. */
export interface AdminClientUserDetail {
  id: number;
  client_id: number;
  name: string;
  nic: string | null;
  address: string | null;
  email: string;
  contact_no: string | null;
  created_at: string;
  updated_at: string;
  roles: { id: number; name: string; guard_name: string }[];
}

/** PUT /v1/client-users/update/{clientUser} (UpdateClientUserDTO) — all 5 fields required. */
export interface UpdateAdminClientUserPayload {
  name: string;
  nic: string;
  address: string;
  email: string;
  contact_no: string;
}
