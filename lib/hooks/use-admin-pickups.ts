import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignRiderToPickup,
  listPickupRequests,
  setPickupStatus,
} from "@/lib/api/admin-pickups";
import { getRidersDropdown } from "@/lib/api/dropdowns";
import type { AdminPickupListParams } from "@/types/admin-pickup";

export function useAdminPickups(params: AdminPickupListParams = {}) {
  return useQuery({
    queryKey: ["admin-pickups", params],
    queryFn: () => listPickupRequests(params),
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
    mutationFn: ({ pickupId, riderId }: { pickupId: number; riderId: number }) =>
      assignRiderToPickup(pickupId, riderId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-pickups"] }),
  });
}

/**
 * One status mutation instead of the old cancel/fail/receive trio.
 *
 * The backend takes a target status and validates it, so three near-identical
 * frontend functions were three chances to disagree with the server about
 * which transitions exist.
 */
export function useSetPickupStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pickupId, status }: { pickupId: number; status: string }) =>
      setPickupStatus(pickupId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-pickups"] }),
  });
}
