import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  cancelPickupRequest,
  createPickupRequest,
  listClientPickups,
} from "@/lib/api/pickups";
import { getClientPickupVehicleTypes } from "@/lib/api/dropdowns";
import type {
  CancelPickupPayload,
  CreatePickupPayload,
  PickupListParams,
} from "@/types/pickup";

export function useClientPickups(params: PickupListParams) {
  return useQuery({
    queryKey: ["client-pickups", params],
    queryFn: () => listClientPickups(params),
    placeholderData: keepPreviousData,
  });
}

export function usePickupVehicleTypes() {
  return useQuery({
    queryKey: ["pickup-vehicle-types"],
    queryFn: getClientPickupVehicleTypes,
    staleTime: 60 * 60 * 1000,
  });
}

export function useCreatePickup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePickupPayload) => createPickupRequest(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-pickups"] }),
  });
}

export function useCancelPickup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CancelPickupPayload) => cancelPickupRequest(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-pickups"] }),
  });
}
