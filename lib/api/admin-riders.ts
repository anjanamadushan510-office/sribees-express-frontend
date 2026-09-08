import { api, pickKey, unwrap, unwrapPaginated } from "@/lib/api/client";
import type { ApiResponse, Paginated } from "@/types/api";
import type {
  RiderDetail,
  RiderListParams,
  RiderRow,
  SaveRiderPayload,
} from "@/types/admin-rider";

/** GET /api/v1/riders/list — paginated delivery-rider directory. */
export async function listRiders(params: RiderListParams): Promise<Paginated<RiderRow>> {
  const res = await api.get<ApiResponse<RiderRow[]>>("/v1/riders/list", {
    params: clean(params),
  });
  return unwrapPaginated<RiderRow>(res);
}

/** GET /api/v1/riders/{staff}. */
export async function getRider(id: number | string): Promise<RiderDetail> {
  const res = await api.get<ApiResponse<unknown>>(`/v1/riders/${id}`);
  const rider = pickKey<RiderDetail>(unwrap(res), "rider");
  if (!rider) throw new Error("Rider not found");
  return rider;
}

/** POST /api/v1/riders/create. */
export async function createRider(payload: SaveRiderPayload): Promise<void> {
  await api.post("/v1/riders/create", payload);
}

/** PUT /api/v1/riders/update/{staff}. */
export async function updateRider(
  id: number | string,
  payload: SaveRiderPayload
): Promise<void> {
  await api.put(`/v1/riders/update/${id}`, payload);
}

/** PUT /api/v1/riders/update/status/{staff}. */
export async function toggleRiderStatus(
  id: number | string,
  isActive: boolean
): Promise<void> {
  await api.put(`/v1/riders/update/status/${id}`, { is_active: isActive });
}

function clean(params: RiderListParams): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out;
}
