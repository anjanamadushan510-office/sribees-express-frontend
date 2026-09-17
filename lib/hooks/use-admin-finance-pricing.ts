import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listClientZoneLaneRates,
  listClientZoneRates,
  updateClientZoneLaneRate,
  updateClientZoneRate,
  upsertClientZoneLaneRate,
  upsertClientZoneRate,
} from "@/lib/api/admin-finance-pricing";
import type {
  ClientZoneLaneRateCreate,
  ClientZoneLaneRateUpdate,
  ClientZoneRateCreate,
  ClientZoneRateUpdate,
} from "@/types/admin-finance-pricing";

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

export function useClientZoneLaneRates(clientId: number) {
  return useQuery({
    queryKey: ["admin-client-zone-lane-rates", clientId],
    queryFn: () => listClientZoneLaneRates(clientId),
  });
}

export function useUpsertClientZoneLaneRate(clientId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ClientZoneLaneRateCreate) => upsertClientZoneLaneRate(clientId, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-client-zone-lane-rates", clientId] }),
  });
}

export function useUpdateClientZoneLaneRate(clientId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ClientZoneLaneRateUpdate }) =>
      updateClientZoneLaneRate(id, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-client-zone-lane-rates", clientId] }),
  });
}
