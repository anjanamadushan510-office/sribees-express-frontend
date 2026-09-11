import { api, get, queryParams, range, toPage } from "@/lib/api/client";
import type { Page } from "@/types/api";
import type {
  ApiKey,
  ApiKeyCreated,
  ApiKeyEnvironment,
  CreateMerchantLoginPayload,
  CreateMerchantPayload,
  CreateRolePayload,
  CreateStaffPayload,
  Merchant,
  MerchantListParams,
  MerchantLogin,
  Permission,
  RoleDetail,
  Staff,
  StaffListParams,
  UpdateMerchantLoginPayload,
  UpdateMerchantPayload,
  UpdateRolePayload,
  UpdateStaffPayload,
} from "@/types/identity";

/**
 * Staff, merchants, merchant logins, roles, permissions and API keys.
 *
 * These are the routes that mint logins and hand third parties access, so every
 * one of them is permission-gated server-side. The UI does not pre-check: it
 * offers the action and lets the API's 403 be the answer, which is the same
 * honesty rule the rest of this app follows.
 */

// --- Staff ------------------------------------------------------------------

/** GET /identity/staff — paged and searchable server-side, unlike /fleet/riders. */
export async function listStaff(
  params: StaffListParams = {}
): Promise<Page<Staff>> {
  const paging = range(params);
  const items = await get<Staff[]>("/identity/staff", {
    params: queryParams({
      search: params.search,
      is_active: params.is_active,
      role_name: params.role_name,
      ...paging,
    }),
  });
  return toPage(items, paging);
}

export async function getStaff(staffId: number): Promise<Staff> {
  return get<Staff>(`/identity/staff/${staffId}`);
}

export async function createStaff(payload: CreateStaffPayload): Promise<Staff> {
  const { data } = await api.post<Staff>("/identity/staff", payload);
  return data;
}

export async function updateStaff(
  staffId: number,
  payload: UpdateStaffPayload
): Promise<Staff> {
  const { data } = await api.patch<Staff>(`/identity/staff/${staffId}`, payload);
  return data;
}

/** Revokes every session for that account as a side effect. */
export async function setStaffPassword(
  staffId: number,
  password: string
): Promise<void> {
  await api.post(`/identity/staff/${staffId}/password`, { password });
}

// --- Merchants --------------------------------------------------------------

export async function listMerchants(
  params: MerchantListParams = {}
): Promise<Page<Merchant>> {
  const paging = range(params);
  const items = await get<Merchant[]>("/identity/clients", {
    params: queryParams({
      search: params.search,
      is_active: params.is_active,
      ...paging,
    }),
  });
  return toPage(items, paging);
}

export async function getMerchant(clientId: number): Promise<Merchant> {
  return get<Merchant>(`/identity/clients/${clientId}`);
}

/**
 * POST /identity/clients — creates the business and its first login together.
 * A merchant with no login is onboarded halfway, so the API takes both.
 */
export async function createMerchant(
  payload: CreateMerchantPayload
): Promise<{ client: Merchant; admin_user: MerchantLogin }> {
  const { data } = await api.post<{ client: Merchant; admin_user: MerchantLogin }>(
    "/identity/clients",
    payload
  );
  return data;
}

export async function updateMerchant(
  clientId: number,
  payload: UpdateMerchantPayload
): Promise<Merchant> {
  const { data } = await api.patch<Merchant>(
    `/identity/clients/${clientId}`,
    payload
  );
  return data;
}

// --- Merchant logins --------------------------------------------------------

export async function listMerchantLogins(
  clientId: number
): Promise<MerchantLogin[]> {
  return get<MerchantLogin[]>(`/identity/clients/${clientId}/users`);
}

export async function createMerchantLogin(
  clientId: number,
  payload: CreateMerchantLoginPayload
): Promise<MerchantLogin> {
  const { data } = await api.post<MerchantLogin>(
    `/identity/clients/${clientId}/users`,
    payload
  );
  return data;
}

export async function updateMerchantLogin(
  clientUserId: number,
  payload: UpdateMerchantLoginPayload
): Promise<MerchantLogin> {
  const { data } = await api.patch<MerchantLogin>(
    `/identity/client-users/${clientUserId}`,
    payload
  );
  return data;
}

export async function setMerchantLoginPassword(
  clientUserId: number,
  password: string
): Promise<void> {
  await api.post(`/identity/client-users/${clientUserId}/password`, { password });
}

// --- API keys ---------------------------------------------------------------

/**
 * Never includes the secret — only the prefix, so an administrator can match a
 * merchant's "the one starting sk_test_9f" against a row.
 */
export async function listApiKeys(clientId: number): Promise<ApiKey[]> {
  return get<ApiKey[]>(`/identity/clients/${clientId}/api-keys`);
}

/**
 * The response carries the only copy of the key that will ever exist. The
 * caller must show it once and say so; there is no endpoint that can retrieve
 * it again.
 */
export async function issueApiKey(
  clientId: number,
  environment: ApiKeyEnvironment,
  rateLimitPerMinute: number
): Promise<ApiKeyCreated> {
  const { data } = await api.post<ApiKeyCreated>(
    `/identity/clients/${clientId}/api-keys`,
    { environment, rate_limit_per_minute: rateLimitPerMinute }
  );
  return data;
}

/** Deactivation, not deletion — the row is the audit trail for past calls. */
export async function revokeApiKey(keyId: number): Promise<ApiKey> {
  const { data } = await api.post<ApiKey>(`/identity/api-keys/${keyId}/revoke`);
  return data;
}

// --- Roles and permissions --------------------------------------------------

export async function listPermissions(): Promise<Permission[]> {
  return get<Permission[]>("/identity/permissions");
}

export async function listRoles(guardName?: string): Promise<RoleDetail[]> {
  return get<RoleDetail[]>("/identity/roles", {
    params: queryParams({ guard_name: guardName }),
  });
}

export async function createRole(payload: CreateRolePayload): Promise<RoleDetail> {
  const { data } = await api.post<RoleDetail>("/identity/roles", payload);
  return data;
}

export async function updateRole(
  roleId: number,
  payload: UpdateRolePayload
): Promise<RoleDetail> {
  const { data } = await api.patch<RoleDetail>(`/identity/roles/${roleId}`, payload);
  return data;
}

export async function deleteRole(roleId: number): Promise<void> {
  await api.delete(`/identity/roles/${roleId}`);
}
