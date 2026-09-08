import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  approveAdminClientProfileRequest,
  getAdminClientProfileRequest,
  listAdminClientProfileRequests,
} from "@/lib/api/admin-client-profiles";
import type {
  AdminClientProfileRequestListParams,
  ApproveClientProfilePayload,
} from "@/types/admin-client-profile";

export function useAdminClientProfileRequests(params: AdminClientProfileRequestListParams) {
  return useQuery({
    queryKey: ["admin-client-profile-requests", params],
    queryFn: () => listAdminClientProfileRequests(params),
    placeholderData: keepPreviousData,
  });
}

export function useAdminClientProfileRequest(id: number | string) {
  return useQuery({
    queryKey: ["admin-client-profile-request", String(id)],
    queryFn: () => getAdminClientProfileRequest(id),
    enabled: !!id,
  });
}

export function useApproveAdminClientProfileRequest(id: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ApproveClientProfilePayload) =>
      approveAdminClientProfileRequest(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-client-profile-requests"] });
      queryClient.invalidateQueries({
        queryKey: ["admin-client-profile-request", String(id)],
      });
    },
  });
}
