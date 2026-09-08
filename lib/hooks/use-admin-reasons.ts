import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createReason,
  deleteReason,
  getReason,
  listReasons,
  updateReason,
} from "@/lib/api/admin-reasons";
import { getReasonTypesDropdown } from "@/lib/api/dropdowns";
import type { ReasonListParams, SaveReasonPayload } from "@/types/admin-reason";

export function useReasons(params: ReasonListParams) {
  return useQuery({
    queryKey: ["admin-reasons", params],
    queryFn: () => listReasons(params),
    placeholderData: keepPreviousData,
  });
}

export function useReason(id: number | string | null) {
  return useQuery({
    queryKey: ["admin-reason", String(id)],
    queryFn: () => getReason(id as number | string),
    enabled: id !== null,
  });
}

export function useReasonTypesDropdown() {
  return useQuery({
    queryKey: ["admin-reason-types-dropdown"],
    queryFn: getReasonTypesDropdown,
    staleTime: 60 * 60 * 1000,
  });
}

export function useCreateReason() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveReasonPayload) => createReason(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-reasons"] }),
  });
}

export function useUpdateReason(id: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveReasonPayload) => updateReason(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reasons"] });
      queryClient.invalidateQueries({ queryKey: ["admin-reason", String(id)] });
    },
  });
}

export function useDeleteReason() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => deleteReason(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-reasons"] }),
  });
}
