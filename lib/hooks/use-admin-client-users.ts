import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getAdminClientUser,
  listAdminClientUsers,
  toggleAdminClientUserStatus,
  updateAdminClientUser,
} from "@/lib/api/admin-client-users";
import type {
  AdminClientUsersListParams,
  UpdateAdminClientUserPayload,
} from "@/types/admin-client-user";

export function useAdminClientUsers(params: AdminClientUsersListParams) {
  return useQuery({
    queryKey: ["admin-client-users", params],
    queryFn: () => listAdminClientUsers(params),
    placeholderData: keepPreviousData,
  });
}

export function useAdminClientUser(id: number | string | null) {
  return useQuery({
    queryKey: ["admin-client-user", String(id)],
    queryFn: () => getAdminClientUser(id as number | string),
    enabled: id !== null,
  });
}

export function useUpdateAdminClientUser(id: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateAdminClientUserPayload) => updateAdminClientUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-client-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-client-user", String(id)] });
    },
  });
}

export function useToggleAdminClientUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number | string; isActive: boolean }) =>
      toggleAdminClientUserStatus(id, isActive),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-client-users"] });
      queryClient.invalidateQueries({
        queryKey: ["admin-client-user", String(variables.id)],
      });
    },
  });
}
