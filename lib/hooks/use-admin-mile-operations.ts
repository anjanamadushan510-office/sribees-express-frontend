import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listMileOperations, updateMileOperationStatus } from "@/lib/api/admin-mile-operations";
import type {
  MileOperationListParams,
  UpdateMileOperationStatusPayload,
} from "@/types/admin-mile-operations";

export function useMileOperations(params: MileOperationListParams) {
  return useQuery({
    queryKey: ["admin-mile-operations", params],
    queryFn: () => listMileOperations(params),
    placeholderData: keepPreviousData,
  });
}

export function useUpdateMileOperationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateMileOperationStatusPayload) =>
      updateMileOperationStatus(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-mile-operations"] }),
  });
}
