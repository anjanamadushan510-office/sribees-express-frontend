import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getStatusMapping, updateOrderMapping, updateStatusMapping } from "@/lib/api/webhook";
import type { UpdateOrderMappingPayload, UpdateStatusMappingPayload } from "@/types/webhook";

export function useStatusMapping(enabled = true) {
  return useQuery({
    queryKey: ["webhook-status-mapping"],
    queryFn: getStatusMapping,
    enabled,
  });
}

export function useUpdateStatusMapping() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateStatusMappingPayload) => updateStatusMapping(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhook-status-mapping"] });
    },
  });
}

export function useUpdateOrderMapping() {
  return useMutation({
    mutationFn: (payload: UpdateOrderMappingPayload) => updateOrderMapping(payload),
  });
}
