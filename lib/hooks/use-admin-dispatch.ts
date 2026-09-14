import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignDispatchPickups,
  listDispatchPickups,
  listPickupPostalCities,
} from "@/lib/api/admin-dispatch";
import type { DispatchAssignRequest, DispatchPickupParams } from "@/types/admin-dispatch";

export function usePickupPostalCities() {
  return useQuery({
    queryKey: ["dispatch-postal-cities"],
    queryFn: listPickupPostalCities,
    // Merchants book around the clock; a board that never refreshes sends a
    // rider to an area that has already been handed out.
    refetchInterval: 60 * 1000,
  });
}

export function useDispatchPickups(params: DispatchPickupParams, enabled = true) {
  return useQuery({
    queryKey: ["dispatch-pickups", params],
    queryFn: () => listDispatchPickups(params),
    enabled,
    placeholderData: (previous) => previous,
  });
}

export function useAssignDispatchPickups() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DispatchAssignRequest) => assignDispatchPickups(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dispatch-pickups"] });
      queryClient.invalidateQueries({ queryKey: ["dispatch-postal-cities"] });
    },
  });
}
