import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createClientPickup, listClientPickups } from "@/lib/api/pickups";
import type { CreatePickupPayload, PickupListParams } from "@/types/pickup";

export function useClientPickups(params: PickupListParams) {
  return useQuery({
    queryKey: ["client-pickups", params],
    queryFn: () => listClientPickups(params),
    placeholderData: keepPreviousData,
  });
}

export function useCreatePickup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePickupPayload) => createClientPickup(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-pickups"] }),
  });
}

// `useCancelPickup` is gone: this backend has no cancel endpoint for a pickup
// request (see docs/API-GAPS.md). A dialog that cannot cancel anything is
// worse than no button, so the UI drops the action rather than faking it.
