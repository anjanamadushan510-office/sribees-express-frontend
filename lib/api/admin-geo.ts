import { api, get, queryParams } from "@/lib/api/client";
import type {
  Branch,
  BranchCreate,
  PostalCity,
  PostalCityBranchAssign,
  PostalCityCreate,
  PostalCityListParams,
  PostalCityPage,
  PostalCityRegion,
  PostalCityZoneAssign,
  Zone,
  ZoneCreate,
} from "@/types/admin-geo";

/**
 * The `/geo` reference data: zones, postal cities and branches.
 *
 * One module rather than three, because they are one screen's worth of
 * concerns and they reference each other — a postal city is priced by a zone
 * and covered by branches. Updates are PATCH and partial, so callers send only
 * what changed; there is no delete on any of them (deactivate instead), which
 * is why every Out type carries `is_active`.
 */

// --- Zones -------------------------------------------------------------------
export const listZones = () => get<Zone[]>("/geo/zones");

export async function createZone(payload: ZoneCreate): Promise<Zone> {
  const { data } = await api.post<Zone>("/geo/zones", payload);
  return data;
}

export async function updateZone(
  zoneId: number,
  payload: Partial<ZoneCreate> & { is_active?: boolean }
): Promise<Zone> {
  const { data } = await api.patch<Zone>(`/geo/zones/${zoneId}`, payload);
  return data;
}

// --- Postal cities -----------------------------------------------------------

/**
 * Paged and filtered server-side. The directory holds every post office town in
 * Sri Lanka, so this list must never be asked for whole.
 */
export const listPostalCities = (params: PostalCityListParams = {}) =>
  get<PostalCityPage>("/geo/postal-cities", {
    params: queryParams({ ...params, limit: params.limit ?? 50, offset: params.offset ?? 0 }),
  });

/** Per-district totals, so the screen can show what is left to roll out. */
export const listPostalCityRegions = () =>
  get<PostalCityRegion[]>("/geo/postal-cities/regions");

/** Price (or, with `zone_id: null`, stop delivering to) a whole district at once. */
export async function assignPostalCitiesToZone(
  payload: PostalCityZoneAssign
): Promise<{ updated: number }> {
  const { data } = await api.post<{ updated: number }>("/geo/postal-cities/assign-zone", payload);
  return data;
}

/** Add a district to a branch's coverage, or remove it with `detach: true`. */
export async function assignPostalCitiesToBranch(
  payload: PostalCityBranchAssign
): Promise<{ updated: number }> {
  const { data } = await api.post<{ updated: number }>(
    "/geo/postal-cities/assign-branch",
    payload
  );
  return data;
}

export async function createPostalCity(payload: PostalCityCreate): Promise<PostalCity> {
  const { data } = await api.post<PostalCity>("/geo/postal-cities", payload);
  return data;
}

export async function updatePostalCity(
  postalCityId: number,
  payload: Partial<PostalCityCreate> & { is_active?: boolean }
): Promise<PostalCity> {
  const { data } = await api.patch<PostalCity>(`/geo/postal-cities/${postalCityId}`, payload);
  return data;
}

// --- Branches ----------------------------------------------------------------
export const listBranches = () => get<Branch[]>("/geo/branches");
export const getBranch = (branchId: number | string) =>
  get<Branch>(`/geo/branches/${branchId}`);

export async function createBranch(payload: BranchCreate): Promise<Branch> {
  const { data } = await api.post<Branch>("/geo/branches", payload);
  return data;
}

export async function updateBranch(
  branchId: number,
  payload: Partial<BranchCreate> & { is_active?: boolean }
): Promise<Branch> {
  const { data } = await api.patch<Branch>(`/geo/branches/${branchId}`, payload);
  return data;
}
