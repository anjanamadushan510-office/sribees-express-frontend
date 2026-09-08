import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listRateCard } from "@/lib/api/pricing";
import type { RateCardListParams } from "@/types/pricing";

export function useRateCard(params: RateCardListParams) {
  return useQuery({
    queryKey: ["rate-card", params],
    queryFn: () => listRateCard(params),
    placeholderData: keepPreviousData,
  });
}
