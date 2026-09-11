import { api, get, queryParams } from "@/lib/api/client";
import type {
  Branch,
  BranchCreate,
  City,
  CityCreate,
  PostOffice,
  PostOfficeAssign,
  PostOfficeCreate,
  PostOfficeListParams,
  PostOfficePage,
  PostOfficeRegion,
  Zone,
  ZoneCreate,
} from "@/types/admin-geo";

/**
 * The `/geo` reference data: zones, cities, branches and post offices.
 *
 * One module rather than four, because they are one screen's worth of
 * concerns and they reference each other — a city belongs to a zone, a branch
 * serves cities. Updates are PATCH and partial, so callers send only what
 * changed; there is no delete on any of them (deactivate instead), which is
 * why every Out type carries `is_active`.
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

// --- Cities ------------------------------------------------------------------
export const listCities = () => get<City[]>("/geo/cities");

export async function createCity(payload: CityCreate): Promise<City> {
  const { data } = await api.post<City>("/geo/cities", payload);
  return data;
}

export async function updateCity(
  cityId: number,
  payload: Partial<CityCreate> & { is_active?: boolean }
): Promise<City> {
  const { data } = await api.patch<City>(`/geo/cities/${cityId}`, payload);
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

// --- Post offices ------------------------------------------------------------

/**
 * Paged and filtered server-side. The directory holds every post office in Sri
 * Lanka, so this is the one `/geo` list that must never be asked for whole.
 */
export const listPostOffices = (params: PostOfficeListParams = {}) =>
  get<PostOfficePage>("/geo/post-offices", {
    params: queryParams({ ...params, limit: params.limit ?? 50, offset: params.offset ?? 0 }),
  });

/** Per-district totals, so the screen can show what is left to route. */
export const listPostOfficeRegions = () =>
  get<PostOfficeRegion[]>("/geo/post-offices/regions");

/**
 * Attach or detach a whole district at once. Assigning 2,111 post offices one
 * at a time is not a workflow anyone would finish.
 */
export async function assignPostOfficesToCity(
  payload: PostOfficeAssign
): Promise<{ updated: number }> {
  const { data } = await api.post<{ updated: number }>(
    "/geo/post-offices/assign-city",
    payload
  );
  return data;
}

export async function createPostOffice(
  payload: PostOfficeCreate
): Promise<PostOffice> {
  const { data } = await api.post<PostOffice>("/geo/post-offices", payload);
  return data;
}

export async function updatePostOffice(
  postOfficeId: number,
  payload: Partial<PostOfficeCreate> & { is_active?: boolean }
): Promise<PostOffice> {
  const { data } = await api.patch<PostOffice>(
    `/geo/post-offices/${postOfficeId}`,
    payload
  );
  return data;
}
