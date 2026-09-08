import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  assignPickupRider,
  cancelAdminPickup,
  failAdminPickup,
  listAdminPickups,
  receivePickupAtBranch,
} from "@/lib/api/admin-pickups";
import { getRidersDropdown } from "@/lib/api/dropdowns";
import type {
  AdminPickupListParams,
  AssignRiderPayload,
  CancelOrFailPickupPayload,
  PickupRequestIdsPayload,
} from "@/types/admin-pickup";

export function useAdminPickups(params: AdminPickupListParams) {
  return useQuery({
    queryKey: ["admin-pickups", params],
    queryFn: () => listAdminPickups(params),
    placeholderData: keepPreviousData,
  });
}

export function useRidersDropdown() {
  return useQuery({
    queryKey: ["admin-riders-dropdown"],
    queryFn: getRidersDropdown,
    staleTime: 10 * 60 * 1000,
  });
}

export function useAssignPickupRider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AssignRiderPayload) => assignPickupRider(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-pickups"] }),
  });
}

export function useReceivePickupAtBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PickupRequestIdsPayload) => receivePickupAtBranch(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-pickups"] }),
  });
}

export function useCancelAdminPickup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CancelOrFailPickupPayload) => cancelAdminPickup(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-pickups"] }),
  });
}

export function useFailAdminPickup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CancelOrFailPickupPayload) => failAdminPickup(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-pickups"] }),
  });
}
