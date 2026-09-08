import { api } from "@/lib/api/client";
import type { TrackingResult } from "@/types/tracking";

/**
 * Public package tracking — POST /api/tracking with { waybill_id }.
 * No authentication required. Wraps a Laravel resource, so the payload is under `data`.
 */
export async function trackWaybill(waybillId: string): Promise<TrackingResult> {
  const { data } = await api.post<{ data: TrackingResult }>("/tracking", {
    waybill_id: waybillId,
  });
  return data.data;
}
