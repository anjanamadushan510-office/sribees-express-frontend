import { api, unwrap, unwrapPaginated } from "@/lib/api/client";
import type { ApiResponse, Paginated } from "@/types/api";
import type {
  AdminClientNotifyListParams,
  AdminClientNotifyRecipient,
  AdminClientNotifyRow,
  CreateClientNotifyPayload,
} from "@/types/admin-client-notify";

/** GET /api/v1/client-notify/list — sent announcements (one row per recipient). */
export async function listAdminClientNotifies(
  params: AdminClientNotifyListParams
): Promise<Paginated<AdminClientNotifyRow>> {
  const res = await api.get<ApiResponse<AdminClientNotifyRow[]>>("/v1/client-notify/list", {
    params,
  });
  return unwrapPaginated<AdminClientNotifyRow>(res);
}

/** POST /api/v1/client-notify/create-client-notify. */
export async function createAdminClientNotify(
  payload: CreateClientNotifyPayload
): Promise<void> {
  await api.post("/v1/client-notify/create-client-notify", payload);
}

/**
 * GET /api/v1/client-notify/view/{notify} — per-recipient breakdown for one
 * announcement. The controller returns a plain numeric-indexed PHP array
 * under `data`, which still goes through `convertToAPIData` (it applies to
 * every `makeReturn()` response, list or not) and comes back as
 * `[{key: 0, value: row0}, {key: 1, value: row1}, ...]` — unwrap the
 * `.value` from each entry, same pattern as the bare-numeric-list quirk
 * documented for Reasons/Zones elsewhere in this codebase.
 */
export async function getAdminClientNotify(
  id: number | string
): Promise<AdminClientNotifyRecipient[]> {
  const res = await api.get<ApiResponse<unknown>>(`/v1/client-notify/view/${id}`);
  const data = unwrap(res);
  if (Array.isArray(data)) {
    return data
      .map((d) => (d && typeof d === "object" && "value" in d ? (d as { value: unknown }).value : d))
      .filter((v): v is AdminClientNotifyRecipient => !!v);
  }
  return [];
}
