import { api, unwrap } from "@/lib/api/client";
import type { ApiResponse } from "@/types/api";

/**
 * Several backend dropdowns return an associative array that the API helper
 * converts into `[{ key, value }]` pairs.
 */
export interface KeyValueOption {
  key: string;
  value: string;
}

/** GET /api/v1/dropdown/client-primary-status-type (auth:client). */
export async function getClientStatusTypes(): Promise<KeyValueOption[]> {
  const res = await api.get<ApiResponse<KeyValueOption[]>>(
    "/v1/dropdown/client-primary-status-type"
  );
  return unwrap<KeyValueOption[]>(res) ?? [];
}

/** GET /api/v1/dropdown/client-cities (auth:client) → [{ key: cityId, value: name }]. */
export async function getClientCities(): Promise<KeyValueOption[]> {
  const res = await api.get<ApiResponse<KeyValueOption[]>>(
    "/v1/dropdown/client-cities"
  );
  return unwrap<KeyValueOption[]>(res) ?? [];
}

/** GET /api/v1/dropdown/client-pickup-vehicle-types → [{ key: id, value: type_name }]. */
export async function getClientPickupVehicleTypes(): Promise<KeyValueOption[]> {
  const res = await api.get<ApiResponse<KeyValueOption[]>>(
    "/v1/dropdown/client-pickup-vehicle-types"
  );
  return unwrap<KeyValueOption[]>(res) ?? [];
}

/** GET /api/v1/dropdown/cities (no auth) → [{ key: cityId, value: name }]. Used by staff forms too. */
export async function getCities(): Promise<KeyValueOption[]> {
  const res = await api.get<ApiResponse<KeyValueOption[]>>("/v1/dropdown/cities");
  return unwrap<KeyValueOption[]>(res) ?? [];
}

/** GET /api/v1/dropdown/branches (auth:staff) → [{ key: branchId, value: name }]. */
export async function getBranches(): Promise<KeyValueOption[]> {
  const res = await api.get<ApiResponse<KeyValueOption[]>>("/v1/dropdown/branches");
  return unwrap<KeyValueOption[]>(res) ?? [];
}

/** GET /api/v1/dropdown/clients?search=&limit= (auth:staff) → [{ key: clientId, value: name }]. */
export async function getClientsDropdown(search?: string): Promise<KeyValueOption[]> {
  const res = await api.get<ApiResponse<KeyValueOption[]>>("/v1/dropdown/clients", {
    params: { search: search || undefined, limit: 50 },
  });
  return unwrap<KeyValueOption[]>(res) ?? [];
}

/** GET /api/v1/dropdown/statuses (auth:staff) → [{ key, value: label }] — order status list. */
export async function getOrderStatusDropdown(): Promise<KeyValueOption[]> {
  const res = await api.get<ApiResponse<KeyValueOption[]>>("/v1/dropdown/statuses");
  return unwrap<KeyValueOption[]>(res) ?? [];
}

/** GET /api/v1/dropdown/primary-status-type (auth:staff) → [{ key: "key_8", value: "Delivered" }]. */
export async function getPrimaryStatusTypes(): Promise<KeyValueOption[]> {
  const res = await api.get<ApiResponse<KeyValueOption[]>>(
    "/v1/dropdown/primary-status-type"
  );
  return unwrap<KeyValueOption[]>(res) ?? [];
}

/** GET /api/v1/dropdown/riders (auth:staff) → [{ key: staffId, value: name }]. */
export async function getRidersDropdown(): Promise<KeyValueOption[]> {
  const res = await api.get<ApiResponse<KeyValueOption[]>>("/v1/dropdown/riders");
  return unwrap<KeyValueOption[]>(res) ?? [];
}

/** GET /api/v1/dropdown/sorting-layers (auth:staff) → [{ key: id, value: name }]. */
export async function getSortingLayersDropdown(): Promise<KeyValueOption[]> {
  const res = await api.get<ApiResponse<KeyValueOption[]>>(
    "/v1/dropdown/sorting-layers"
  );
  return unwrap<KeyValueOption[]>(res) ?? [];
}

/** GET /api/v1/dropdown/reason-types (auth:staff) → [{ key: id, value: name }]. */
export async function getReasonTypesDropdown(): Promise<KeyValueOption[]> {
  const res = await api.get<ApiResponse<KeyValueOption[]>>("/v1/dropdown/reason-types");
  return unwrap<KeyValueOption[]>(res) ?? [];
}

/** GET /api/v1/dropdown/staff?search=&limit= (auth:staff) → [{ key: staffId, value: name }]. */
export async function getStaffDropdown(search?: string): Promise<KeyValueOption[]> {
  const res = await api.get<ApiResponse<KeyValueOption[]>>("/v1/dropdown/staff", {
    params: { search: search || undefined, limit: 50 },
  });
  return unwrap<KeyValueOption[]>(res) ?? [];
}

/** GET /api/v1/dropdown/tax-types (auth:staff) → [{ key: id, value: name }]. */
export async function getTaxTypesDropdown(): Promise<KeyValueOption[]> {
  const res = await api.get<ApiResponse<KeyValueOption[]>>("/v1/dropdown/tax-types");
  return unwrap<KeyValueOption[]>(res) ?? [];
}

/** GET /api/v1/dropdown/roles (auth:staff) → [{ key: id, value: name }] (staff-guard roles). */
export async function getRolesDropdown(): Promise<KeyValueOption[]> {
  const res = await api.get<ApiResponse<KeyValueOption[]>>("/v1/dropdown/roles");
  return unwrap<KeyValueOption[]>(res) ?? [];
}

/** GET /api/v1/dropdown/permissions (auth:staff) → [{ key: id, value: name }]. */
export async function getPermissionsDropdown(): Promise<KeyValueOption[]> {
  const res = await api.get<ApiResponse<KeyValueOption[]>>("/v1/dropdown/permissions");
  return unwrap<KeyValueOption[]>(res) ?? [];
}

/** GET /api/v1/dropdown/district (auth:staff) → [{ key: id, value: name }]. */
export async function getDistrictDropdown(): Promise<KeyValueOption[]> {
  const res = await api.get<ApiResponse<KeyValueOption[]>>("/v1/dropdown/district");
  return unwrap<KeyValueOption[]>(res) ?? [];
}

/** GET /api/v1/dropdown/zones (auth:staff) → [{ key: id, value: name }]. */
export async function getZonesDropdown(): Promise<KeyValueOption[]> {
  const res = await api.get<ApiResponse<KeyValueOption[]>>("/v1/dropdown/zones");
  return unwrap<KeyValueOption[]>(res) ?? [];
}

/** GET /api/v1/dropdown/expense-types (auth:staff) → [{ key: id, value: name }]. */
export async function getExpenseTypesDropdown(): Promise<KeyValueOption[]> {
  const res = await api.get<ApiResponse<KeyValueOption[]>>("/v1/dropdown/expense-types");
  return unwrap<KeyValueOption[]>(res) ?? [];
}
