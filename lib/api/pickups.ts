import { api, unwrapPaginated } from "@/lib/api/client";
import type { ApiResponse, Paginated } from "@/types/api";
import type {
  CancelPickupPayload,
  CreatePickupPayload,
  PickupListParams,
  PickupRow,
} from "@/types/pickup";

/** GET /api/v1/client-pickup-request/list — paginated pickup requests for the client. */
export async function listClientPickups(
  params: PickupListParams
): Promise<Paginated<PickupRow>> {
  const res = await api.get<ApiResponse<PickupRow[]>>(
    "/v1/client-pickup-request/list",
    { params: clean(params) }
  );
  return unwrapPaginated<PickupRow>(res);
}

/** POST /api/v1/client-pickup-request/create. */
export async function createPickupRequest(
  payload: CreatePickupPayload
): Promise<void> {
  await api.post("/v1/client-pickup-request/create", payload);
}

/** PUT /api/v1/client-pickup-request/cancel. */
export async function cancelPickupRequest(
  payload: CancelPickupPayload
): Promise<void> {
  await api.put("/v1/client-pickup-request/cancel", payload);
}

function clean(params: PickupListParams): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    out[k] = v;
  }
  return out;
}
