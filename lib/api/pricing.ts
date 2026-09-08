import { api, unwrapPaginated } from "@/lib/api/client";
import type { ApiResponse, Paginated } from "@/types/api";
import type { RateCardRow, RateCardListParams } from "@/types/pricing";

/** GET /api/v1/rate-card/list — the signed-in client's per-city delivery rates. */
export async function listRateCard(
  params: RateCardListParams
): Promise<Paginated<RateCardRow>> {
  const res = await api.get<ApiResponse<RateCardRow[]>>("/v1/rate-card/list", {
    params: clean(params),
  });
  return unwrapPaginated<RateCardRow>(res);
}

function clean(params: RateCardListParams): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    out[k] = v;
  }
  return out;
}
