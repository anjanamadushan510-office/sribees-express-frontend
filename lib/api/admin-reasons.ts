import { api, unwrap, unwrapPaginated } from "@/lib/api/client";
import type { ApiResponse, Paginated } from "@/types/api";
import type {
  ReasonDetail,
  ReasonListParams,
  ReasonRow,
  SaveReasonPayload,
} from "@/types/admin-reason";

/** GET /api/v1/reasons/list — paginated reason directory. */
export async function listReasons(params: ReasonListParams): Promise<Paginated<ReasonRow>> {
  const res = await api.get<ApiResponse<ReasonRow[]>>("/v1/reasons/list", {
    params: clean(params),
  });
  return unwrapPaginated<ReasonRow>(res);
}

/**
 * GET /api/v1/reasons/{reason} — the controller returns `data: [$reason]`, a
 * plain numeric-keyed array. The envelope helper's `convertToAPIData` still
 * reshapes that single entry into `[{ key: 0, value: $reason }]` (it applies
 * to any array/object, not just named keys), so unwrap and pull `.value`.
 */
export async function getReason(id: number | string): Promise<ReasonDetail> {
  const res = await api.get<ApiResponse<{ key: number; value: ReasonDetail }[]>>(
    `/v1/reasons/${id}`
  );
  const rows = unwrap(res) ?? [];
  const reason = rows[0]?.value;
  if (!reason) throw new Error("Reason not found");
  return reason;
}

/** POST /api/v1/reasons/create. */
export async function createReason(payload: SaveReasonPayload): Promise<void> {
  await api.post("/v1/reasons/create", payload);
}

/** PUT /api/v1/reasons/update/{reason}. */
export async function updateReason(
  id: number | string,
  payload: SaveReasonPayload
): Promise<void> {
  await api.put(`/v1/reasons/update/${id}`, payload);
}

/** DELETE /api/v1/reasons/{reason}. */
export async function deleteReason(id: number | string): Promise<void> {
  await api.delete(`/v1/reasons/${id}`);
}

function clean(params: ReasonListParams): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    out[k] = v;
  }
  return out;
}
