import { api, pickKey, unwrap, unwrapPaginated } from "@/lib/api/client";
import type { ApiResponse, Paginated } from "@/types/api";
import type {
  CreateWaybillRequestPayload,
  WaybillRequestListParams,
  WaybillRequestRow,
} from "@/types/admin-waybill";

/** GET /api/v1/waybill-request/list. */
export async function listWaybillRequests(
  params: WaybillRequestListParams
): Promise<Paginated<WaybillRequestRow>> {
  const res = await api.get<ApiResponse<WaybillRequestRow[]>>("/v1/waybill-request/list", {
    params: clean(params),
  });
  return unwrapPaginated<WaybillRequestRow>(res);
}

/** POST /api/v1/waybill-request/create. */
export async function createWaybillRequest(
  payload: CreateWaybillRequestPayload
): Promise<void> {
  await api.post("/v1/waybill-request/create", payload);
}

/** PUT /api/v1/waybill-request/status/{id} (ToggleStatusDTO). */
export async function toggleWaybillRequestStatus(
  id: number | string,
  isActive: boolean
): Promise<void> {
  await api.put(`/v1/waybill-request/status/${id}`, { is_active: isActive });
}

/** PUT /api/v1/waybill-request/reject/{id}. */
export async function rejectWaybillRequest(id: number | string): Promise<void> {
  await api.put(`/v1/waybill-request/reject/${id}`);
}

/** PUT /api/v1/waybill-request/restore/{id}. */
export async function restoreWaybillRequest(id: number | string): Promise<void> {
  await api.put(`/v1/waybill-request/restore/${id}`);
}

/** GET /api/v1/waybill-ranges/next → data.next_available_start. */
export async function getNextAvailableWaybillStart(): Promise<string> {
  const res = await api.get<ApiResponse<unknown>>("/v1/waybill-ranges/next");
  return pickKey<string>(unwrap(res), "next_available_start") ?? "";
}

function clean(params: WaybillRequestListParams): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    out[k] = v;
  }
  return out;
}
