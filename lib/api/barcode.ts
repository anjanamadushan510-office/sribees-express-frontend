import { api, pickKey, unwrap } from "@/lib/api/client";
import type { ApiResponse } from "@/types/api";
import type { BarcodeLabel } from "@/types/barcode";

/**
 * GET /api/v1/client-barcodes/print-barcode?id[]=1&id[]=2 — order ids (orders.id,
 * not waybill numbers). Returns printable label data for each. Response goes
 * through the named-key-list envelope reshape (`{data: {barcode_data: [...]}}`
 * → `[{key:"barcode_data", value:[...]}]`), so read via `pickKey()`.
 */
export async function printClientBarcode(ids: (number | string)[]): Promise<BarcodeLabel[]> {
  const res = await api.get<ApiResponse<unknown>>("/v1/client-barcodes/print-barcode", {
    params: { id: ids.map(Number) },
  });
  const data = unwrap(res);
  return pickKey<BarcodeLabel[]>(data, "barcode_data") ?? [];
}
