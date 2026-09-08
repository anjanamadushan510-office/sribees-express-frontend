import { api, unwrap } from "@/lib/api/client";
import type { ApiResponse } from "@/types/api";
import type {
  StatusMappingConfig,
  UpdateOrderMappingPayload,
  UpdateStatusMappingPayload,
} from "@/types/webhook";

/** GET /api/v1/webhook/list — current status-mapping URL/method/config. */
export async function getStatusMapping(): Promise<StatusMappingConfig> {
  const res = await api.get<ApiResponse<StatusMappingConfig>>("/v1/webhook/list");
  return (
    unwrap(res) ?? {
      url: null,
      method: null,
      mapping_status: null,
    }
  );
}

/** PUT /api/v1/webhook/status-mapping/update. */
export async function updateStatusMapping(
  payload: UpdateStatusMappingPayload
): Promise<void> {
  await api.put("/v1/webhook/status-mapping/update", payload);
}

/** PUT /api/v1/webhook/order-mapping/update. */
export async function updateOrderMapping(
  payload: UpdateOrderMappingPayload
): Promise<void> {
  await api.put("/v1/webhook/order-mapping/update", payload);
}
