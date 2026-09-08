import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createAdminClientNotify,
  getAdminClientNotify,
  listAdminClientNotifies,
} from "@/lib/api/admin-client-notify";
import type {
  AdminClientNotifyListParams,
  CreateClientNotifyPayload,
} from "@/types/admin-client-notify";

export function useAdminClientNotifies(params: AdminClientNotifyListParams) {
  return useQuery({
    queryKey: ["admin-client-notifies", params],
    queryFn: () => listAdminClientNotifies(params),
    placeholderData: keepPreviousData,
  });
}

export function useAdminClientNotify(id: number | string) {
  return useQuery({
    queryKey: ["admin-client-notify", String(id)],
    queryFn: () => getAdminClientNotify(id),
    enabled: !!id,
  });
}

export function useCreateAdminClientNotify() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateClientNotifyPayload) => createAdminClientNotify(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-client-notifies"] });
    },
  });
}
