import { get, queryParams } from "@/lib/api/client";
import { unavailable } from "@/lib/api/unavailable";
import type { PostalCity, PostalCityPage } from "@/types/admin-geo";
import type { OrderStatus } from "@/types/order";

/**
 * Select-input options. Kept as `{ key, value }` because every form in the app
 * already binds to that shape — the backend now returns real resources, and
 * these functions are the one place that flattening happens.
 */
export interface KeyValueOption {
  key: string;
  value: string;
}

interface Branch {
  id: number;
  name: string;
}

interface Zone {
  id: number;
  name: string;
}

interface Rider {
  id: number;
  name: string;
}

const toOption = (row: { id: number; name: string }): KeyValueOption => ({
  key: String(row.id),
  value: row.name,
});

// --- Client-guard dropdowns --------------------------------------------------

/** How many matches a postal city search shows. A search box, not a list. */
const POSTAL_CITY_SEARCH_LIMIT = 20;

/**
 * GET /client-portal/postal-cities — search for a customer's address.
 *
 * Not /geo/postal-cities: that router is staff-only, by design. Retired cities
 * never come back. `zoned: true` narrows to places with delivery, which is what
 * a shipment's destination needs; a pickup address may be anywhere.
 */
export function searchClientPostalCities(
  search: string,
  options: { zoned?: boolean } = {}
): Promise<PostalCity[]> {
  return get<PostalCity[]>("/client-portal/postal-cities", {
    params: queryParams({ search, zoned: options.zoned, limit: POSTAL_CITY_SEARCH_LIMIT }),
  });
}

/** GET /client-portal/order-statuses — catalogue, already in pipeline order. */
export async function getClientStatusTypes(): Promise<KeyValueOption[]> {
  const statuses = await get<OrderStatus[]>("/client-portal/order-statuses");
  return statuses.map((s) => ({ key: s.key, value: s.name }));
}

// --- Staff-guard dropdowns ---------------------------------------------------

/** GET /geo/postal-cities — staff search, active cities only. */
export async function searchStaffPostalCities(search: string): Promise<PostalCity[]> {
  const page = await get<PostalCityPage>("/geo/postal-cities", {
    params: queryParams({ search, limit: POSTAL_CITY_SEARCH_LIMIT }),
  });
  return page.items.filter((city) => city.is_active);
}

/**
 * The old city dropdown. Cities became postal cities (2,111 of them), which a
 * select cannot hold, so the screens still calling this — not yet rewired to
 * this backend — fail with a message that says where the data went.
 */
export async function getCities(): Promise<KeyValueOption[]> {
  return unavailable("City list (replaced by postal cities — see Locations)");
}

/** GET /geo/branches */
export async function getBranches(): Promise<KeyValueOption[]> {
  const branches = await get<Branch[]>("/geo/branches");
  return branches.map(toOption);
}

/** GET /geo/zones */
export async function getZonesDropdown(): Promise<KeyValueOption[]> {
  const zones = await get<Zone[]>("/geo/zones");
  return zones.map(toOption);
}

/** GET /fleet/riders */
export async function getRidersDropdown(): Promise<KeyValueOption[]> {
  const riders = await get<Rider[]>("/fleet/riders");
  return riders.map(toOption);
}

// --- Not available on this backend -------------------------------------------
// Each of these had a Laravel `/dropdown/*` endpoint with no counterpart here.
// They throw rather than return [], so a form never renders an empty select
// that looks like "there are none" when it really means "we could not ask".

/** No staff-facing status catalogue endpoint exists (the client one is client-only). */
export async function getOrderStatusDropdown(): Promise<KeyValueOption[]> {
  return unavailable("Order status list (staff)");
}

export async function getPrimaryStatusTypes(): Promise<KeyValueOption[]> {
  return unavailable("Primary status types");
}

export async function getClientPickupVehicleTypes(): Promise<KeyValueOption[]> {
  return unavailable("Pickup vehicle types");
}

export async function getClientsDropdown(search?: string): Promise<KeyValueOption[]> {
  // The search term is folded into the message rather than dropped: when this
  // surfaces in a toast, "Client search \"acme\"" tells you which control failed.
  return unavailable(search ? `Client search "${search}"` : "Client list");
}

export async function getStaffDropdown(search?: string): Promise<KeyValueOption[]> {
  return unavailable(search ? `Staff search "${search}"` : "Staff list");
}

export async function getSortingLayersDropdown(): Promise<KeyValueOption[]> {
  return unavailable("Sorting layers");
}

export async function getReasonTypesDropdown(): Promise<KeyValueOption[]> {
  return unavailable("Reason types");
}

export async function getTaxTypesDropdown(): Promise<KeyValueOption[]> {
  return unavailable("Tax types");
}

export async function getRolesDropdown(): Promise<KeyValueOption[]> {
  return unavailable("Roles");
}

export async function getPermissionsDropdown(): Promise<KeyValueOption[]> {
  return unavailable("Permissions");
}

export async function getDistrictDropdown(): Promise<KeyValueOption[]> {
  return unavailable("Districts");
}

export async function getExpenseTypesDropdown(): Promise<KeyValueOption[]> {
  return unavailable("Expense types");
}
