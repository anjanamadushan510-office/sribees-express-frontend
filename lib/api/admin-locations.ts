import { api, pickKey, unwrap, unwrapPaginated } from "@/lib/api/client";
import type { ApiResponse, Paginated } from "@/types/api";
import type {
  CityDetail,
  CityListParams,
  CityRow,
  SaveCityPayload,
  SaveZonePayload,
  ZoneDetail,
  ZoneListParams,
  ZoneRow,
} from "@/types/admin-location";

// --- Cities ---

/** GET /api/v1/cities/list. */
export async function listCities(params: CityListParams): Promise<Paginated<CityRow>> {
  const res = await api.get<ApiResponse<CityRow[]>>("/v1/cities/list", {
    params: clean(params),
  });
  return unwrapPaginated<CityRow>(res);
}

/** GET /api/v1/cities/{city}. */
export async function getCity(id: number | string): Promise<CityDetail> {
  const res = await api.get<ApiResponse<unknown>>(`/v1/cities/${id}`);
  const city = pickKey<CityDetail>(unwrap(res), "city");
  if (!city) throw new Error("City not found");
  return city;
}

/** POST /api/v1/cities/create. */
export async function createCity(payload: SaveCityPayload): Promise<void> {
  await api.post("/v1/cities/create", payload);
}

/** PUT /api/v1/cities/update/{city}. */
export async function updateCity(id: number | string, payload: SaveCityPayload): Promise<void> {
  await api.put(`/v1/cities/update/${id}`, payload);
}

/** PUT /api/v1/cities/update/status/{city} (ToggleStatusDTO). */
export async function toggleCityStatus(id: number | string, isActive: boolean): Promise<void> {
  await api.put(`/v1/cities/update/status/${id}`, { is_active: isActive });
}

// --- Zones ---

/** GET /api/v1/zones/list. */
export async function listZones(params: ZoneListParams): Promise<Paginated<ZoneRow>> {
  const res = await api.get<ApiResponse<ZoneRow[]>>("/v1/zones/list", {
    params: clean(params),
  });
  return unwrapPaginated<ZoneRow>(res);
}

/**
 * GET /api/v1/zones/{zone} — the controller returns `data: [$zone]`, a bare
 * numeric-keyed array, so `convertToAPIData` reshapes it into
 * `[{ key: 0, value: $zone }]`; pull `.value`.
 */
export async function getZone(id: number | string): Promise<ZoneDetail> {
  const res = await api.get<ApiResponse<{ key: number; value: ZoneDetail }[]>>(
    `/v1/zones/${id}`
  );
  const rows = unwrap(res) ?? [];
  const zone = rows[0]?.value;
  if (!zone) throw new Error("Zone not found");
  return zone;
}

/** POST /api/v1/zones/create. */
export async function createZone(payload: SaveZonePayload): Promise<void> {
  await api.post("/v1/zones/create", payload);
}

/** PUT /api/v1/zones/update/{zone}. */
export async function updateZone(id: number | string, payload: SaveZonePayload): Promise<void> {
  await api.put(`/v1/zones/update/${id}`, payload);
}

function clean<T extends object>(params: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    out[k] = v;
  }
  return out;
}
