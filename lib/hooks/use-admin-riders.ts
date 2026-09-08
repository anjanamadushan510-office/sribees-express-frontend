import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createRider,
  getRider,
  listRiders,
  toggleRiderStatus,
  updateRider,
} from "@/lib/api/admin-riders";
import type { RiderListParams, SaveRiderPayload } from "@/types/admin-rider";

export function useRiders(params: RiderListParams) {
  return useQuery({
    queryKey: ["admin-riders", params],
    queryFn: () => listRiders(params),
    placeholderData: keepPreviousData,
  });
}

export function useRider(id: number | string | null) {
  return useQuery({
    queryKey: ["admin-rider", String(id)],
    queryFn: () => getRider(id as number | string),
    enabled: id !== null,
  });
}

export function useCreateRider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveRiderPayload) => createRider(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-riders"] }),
  });
}

export function useUpdateRider(id: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveRiderPayload) => updateRider(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-riders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-rider", String(id)] });
    },
  });
}

export function useToggleRiderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number | string; isActive: boolean }) =>
      toggleRiderStatus(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-riders"] }),
  });
}
