import { api, unwrapPaginated } from "@/lib/api/client";
import type { ApiResponse, Paginated } from "@/types/api";
import type {
  MileOperationListParams,
  MileOperationRow,
  UpdateMileOperationStatusPayload,
} from "@/types/admin-mile-operations";

/** GET /api/v1/mile-operations/list. */
export async function listMileOperations(
  params: MileOperationListParams
): Promise<Paginated<MileOperationRow>> {
  const res = await api.get<ApiResponse<MileOperationRow[]>>("/v1/mile-operations/list", {
    params: clean(params),
  });
  return unwrapPaginated<MileOperationRow>(res);
}

/** PUT /api/v1/mile-operations/update. */
export async function updateMileOperationStatus(
  payload: UpdateMileOperationStatusPayload
): Promise<void> {
  await api.put("/v1/mile-operations/update", payload);
}

function clean<T extends object>(params: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out;
}
