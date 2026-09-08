import { api, unwrapPaginated } from "@/lib/api/client";
import type { ApiResponse, Paginated } from "@/types/api";
import type {
  ClientWaybillRequestListParams,
  ClientWaybillRequestRow,
  CreateClientWaybillRequestPayload,
} from "@/types/waybill-request";

/** GET /api/v1/client-waybill-request/list — the signed-in client's waybill-range requests. */
export async function listClientWaybillRequests(
  params: ClientWaybillRequestListParams
): Promise<Paginated<ClientWaybillRequestRow>> {
  const res = await api.get<ApiResponse<ClientWaybillRequestRow[]>>(
    "/v1/client-waybill-request/list",
    { params }
  );
  return unwrapPaginated<ClientWaybillRequestRow>(res);
}

/** POST /api/v1/client-waybill-request/create — max one pending request per day. */
export async function createClientWaybillRequest(
  payload: CreateClientWaybillRequestPayload
): Promise<void> {
  await api.post("/v1/client-waybill-request/create", payload);
}
