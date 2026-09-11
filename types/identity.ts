/**
 * The `identity` domain: staff, merchants, merchant logins, roles, permissions
 * and the API keys a merchant integrates with.
 *
 * Mirrors `app/identity/schemas.py`. Nothing here is the Laravel shape — the
 * old `types/admin-client.ts` and `types/admin-staff.ts` describe an API that
 * no longer exists.
 */

export interface Role {
  id: number;
  name: string;
  guard_name: string;
}

export interface Permission {
  id: number;
  name: string;
  /** Groups permissions in the UI. Nothing else reads it. */
  category: string | null;
}

export interface RoleDetail extends Role {
  permissions: Permission[];
}

export interface Staff {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  roles: Role[];
}

export interface Merchant {
  id: number;
  business_name: string;
  email: string;
  commission_percent: string;
  is_active: boolean;
}

export interface MerchantLogin {
  id: number;
  client_id: number;
  name: string;
  email: string;
  is_active: boolean;
  roles: Role[];
}

/**
 * What the API returns when a key is issued. `api_key` is the only time the
 * secret exists outside the merchant's hands — it is stored hashed, so there is
 * no second chance to read it and the UI must say so.
 */
export interface ApiKeyCreated {
  key_prefix: string;
  api_key: string;
  rate_limit_per_minute: number;
  environment: ApiKeyEnvironment;
}

export interface ApiKey {
  id: number;
  key_prefix: string;
  rate_limit_per_minute: number;
  environment: ApiKeyEnvironment;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
}

export type ApiKeyEnvironment = "live" | "sandbox";

export interface StaffListParams {
  search?: string;
  is_active?: boolean;
  /** Exact role name. "Delivery Rider" is the rider roster. */
  role_name?: string;
  limit?: number;
  offset?: number;
}

export interface MerchantListParams {
  search?: string;
  is_active?: boolean;
  limit?: number;
  offset?: number;
}

export interface CreateStaffPayload {
  name: string;
  email: string;
  phone?: string | null;
  password: string;
  role_ids: number[];
}

export interface UpdateStaffPayload {
  name?: string;
  email?: string;
  phone?: string | null;
  is_active?: boolean;
  /** Omit to leave roles alone; `[]` strips every role. */
  role_ids?: number[];
}

export interface CreateMerchantPayload {
  business_name: string;
  email: string;
  phone?: string | null;
  commission_percent: string;
  /** The first login, created in the same transaction as the merchant. */
  admin_name: string;
  admin_email: string;
  admin_password: string;
}

export interface UpdateMerchantPayload {
  business_name?: string;
  email?: string;
  phone?: string | null;
  commission_percent?: string;
  is_active?: boolean;
}

export interface CreateMerchantLoginPayload {
  name: string;
  email: string;
  password: string;
}

export interface UpdateMerchantLoginPayload {
  name?: string;
  email?: string;
  is_active?: boolean;
}

export interface CreateRolePayload {
  name: string;
  guard_name: "staff" | "client";
  permission_ids: number[];
}

export interface UpdateRolePayload {
  name?: string;
  /** Omit to leave permissions alone; `[]` strips them all. */
  permission_ids?: number[];
}
