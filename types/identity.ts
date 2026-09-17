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

/** The town an address is in, sent alongside its id so nothing needs a lookup. */
export interface PostalCityRef {
  id: number;
  name: string;
  district: string | null;
  province: string | null;
}

export interface Merchant {
  id: number;
  business_name: string;
  email: string;
  phone: string | null;
  /** Registered address. Null only for merchants created before it was required. */
  address: string | null;
  postal_city_id: number | null;
  postal_city: PostalCityRef | null;
  commission_percent: string;
  /** The kg block this merchant's pricing is negotiated in — governs every
   * price quoted to them, their own zone/zone-lane overrides and the
   * standard rate alike. */
  weight_basis_kg: 1 | 5 | 10;
  is_active: boolean;
}

/**
 * One of a merchant's physical locations — where parcels are collected from.
 * Registration makes the first one ("Main") at the registered address. Outlets
 * are retired, never deleted: orders keep a copy of where they came from.
 */
export interface ClientOutlet {
  id: number;
  client_id: number;
  name: string;
  phone: string;
  address: string;
  postal_city_id: number;
  postal_city: PostalCityRef;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
}

export interface MerchantLogin {
  id: number;
  client_id: number;
  /** The outlet this login works at. Null for people who speak for all of them. */
  outlet_id: number | null;
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
  /** Defaults to 1 (per-kg) server-side if omitted. */
  weight_basis_kg?: 1 | 5 | 10;
  /** Required. The same address becomes the merchant's "Main" outlet. */
  address: string;
  postal_city_id: number;
  /** The first login, created in the same transaction as the merchant. */
  admin_name: string;
  admin_email: string;
  admin_password: string;
}

export interface UpdateMerchantPayload {
  business_name?: string;
  email?: string;
  phone?: string | null;
  /** Can be changed, never cleared. */
  address?: string;
  postal_city_id?: number;
  commission_percent?: string;
  weight_basis_kg?: 1 | 5 | 10;
  is_active?: boolean;
}

export interface SaveOutletPayload {
  name: string;
  phone: string;
  address: string;
  postal_city_id: number;
}

export interface CreateMerchantLoginPayload {
  name: string;
  email: string;
  password: string;
  outlet_id?: number | null;
}

export interface UpdateMerchantLoginPayload {
  name?: string;
  email?: string;
  /** `null` detaches the login from its outlet. */
  outlet_id?: number | null;
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
