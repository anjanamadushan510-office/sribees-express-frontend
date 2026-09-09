import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignRiderToOrder,
  getRider,
  getRiderLocation,
  listRiders,
} from "@/lib/api/admin-riders";

/**
 * Riders are read-only here.
 *
 * A rider is a Staff row with the rider role, and this API exposes no staff
 * CRUD — creating or editing one is not something the frontend can do yet.
 * See docs/API-GAPS.md; the create/edit dialog is gone rather than wired to a
 * button that always fails.
 */
export function useRiders() {
  return useQuery({ queryKey: ["admin-riders"], queryFn: listRiders });
}

export function useRider(id: number | string | null) {
  return useQuery({
    queryKey: ["admin-rider", String(id)],
    queryFn: () => getRider(id as number | string),
    enabled: id !== null,
  });
}

/** Last known GPS ping. Null (not an error) when the rider has never sent one. */
export function useRiderLocation(id: number | string | null) {
  return useQuery({
    queryKey: ["admin-rider-location", String(id)],
    queryFn: () => getRiderLocation(id as number | string),
    enabled: id !== null,
    refetchInterval: 30_000,
  });
}

export function useAssignRiderToOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, riderId }: { orderId: number | string; riderId: number }) =>
      assignRiderToOrder(orderId, riderId),
    onSuccess: (_order, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-order", String(orderId)] });
    },
  });
}
