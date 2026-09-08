import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createRole,
  getPermissionCategories,
  getRole,
  listRoles,
  updateRole,
} from "@/lib/api/admin-roles";
import type { CreateRolePayload, RoleListParams, UpdateRolePayload } from "@/types/admin-role";

export function useRoles(params: RoleListParams) {
  return useQuery({
    queryKey: ["admin-roles", params],
    queryFn: () => listRoles(params),
    placeholderData: keepPreviousData,
  });
}

export function useRole(id: number | string | null) {
  return useQuery({
    queryKey: ["admin-role", String(id)],
    queryFn: () => getRole(id as number | string),
    enabled: id !== null,
  });
}

export function usePermissionCategories() {
  return useQuery({
    queryKey: ["admin-permission-categories"],
    queryFn: getPermissionCategories,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRolePayload) => createRole(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-roles"] }),
  });
}

export function useUpdateRole(id: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateRolePayload) => updateRole(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-role", String(id)] });
    },
  });
}
