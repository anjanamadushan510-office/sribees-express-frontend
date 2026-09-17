import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listClientZoneRates,
  updateClientZoneRate,
  upsertClientZoneRate,
} from "@/lib/api/admin-finance-pricing";
import type { ClientZoneRateCreate, ClientZoneRateUpdate } from "@/types/admin-finance-pricing";

export function useClientZoneRates(clientId: number) {
  return useQuery({
    queryKey: ["admin-client-zone-rates", clientId],
    queryFn: () => listClientZoneRates(clientId),
  });
}

export function useUpsertClientZoneRate(clientId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ClientZoneRateCreate) => upsertClientZoneRate(clientId, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-client-zone-rates", clientId] }),
  });
}

export function useUpdateClientZoneRate(clientId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ClientZoneRateUpdate }) =>
      updateClientZoneRate(id, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-client-zone-rates", clientId] }),
  });
}
