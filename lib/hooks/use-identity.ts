import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createMerchant,
  createMerchantLogin,
  createOutlet,
  createRole,
  createStaff,
  deleteRole,
  getMerchant,
  issueApiKey,
  listApiKeys,
  listMerchantLogins,
  listOutlets,
  listMerchants,
  listPermissions,
  listRoles,
  listStaff,
  revokeApiKey,
  setMerchantLoginPassword,
  setStaffPassword,
  updateMerchant,
  updateMerchantLogin,
  updateOutlet,
  updateRole,
  updateStaff,
} from "@/lib/api/identity";
import type {
  ApiKeyEnvironment,
  CreateMerchantLoginPayload,
  CreateMerchantPayload,
  CreateRolePayload,
  CreateStaffPayload,
  MerchantListParams,
  SaveOutletPayload,
  StaffListParams,
  UpdateMerchantLoginPayload,
  UpdateMerchantPayload,
  UpdateRolePayload,
  UpdateStaffPayload,
} from "@/types/identity";

// --- Staff ------------------------------------------------------------------

export function useStaff(params: StaffListParams = {}) {
  return useQuery({
    queryKey: ["identity-staff", params],
    queryFn: () => listStaff(params),
    placeholderData: (previous) => previous,
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStaffPayload) => createStaff(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["identity-staff"] });
      // The rider roster is the staff list filtered by role, so a new rider
      // has to invalidate the old read-only view too.
      queryClient.invalidateQueries({ queryKey: ["admin-riders"] });
    },
  });
}

export function useUpdateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateStaffPayload }) =>
      updateStaff(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["identity-staff"] });
      queryClient.invalidateQueries({ queryKey: ["admin-riders"] });
    },
  });
}

export function useSetStaffPassword() {
  return useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      setStaffPassword(id, password),
  });
}

// --- Merchants --------------------------------------------------------------

export function useMerchants(params: MerchantListParams = {}) {
  return useQuery({
    queryKey: ["identity-merchants", params],
    queryFn: () => listMerchants(params),
    placeholderData: (previous) => previous,
  });
}

export function useMerchant(id: number | null) {
  return useQuery({
    queryKey: ["identity-merchant", id],
    queryFn: () => getMerchant(id as number),
    enabled: id !== null,
  });
}

export function useCreateMerchant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMerchantPayload) => createMerchant(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["identity-merchants"] });
    },
  });
}

export function useUpdateMerchant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateMerchantPayload }) =>
      updateMerchant(id, payload),
    onSuccess: (_merchant, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["identity-merchants"] });
      queryClient.invalidateQueries({ queryKey: ["identity-merchant", id] });
    },
  });
}

// --- Merchant outlets -------------------------------------------------------

export function useOutlets(clientId: number | null) {
  return useQuery({
    queryKey: ["identity-merchant-outlets", clientId],
    queryFn: () => listOutlets(clientId as number),
    enabled: clientId !== null,
  });
}

export function useSaveOutlet(clientId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | null;
      payload: Partial<SaveOutletPayload> & { is_active?: boolean };
    }) =>
      id === null
        ? createOutlet(clientId, payload as SaveOutletPayload)
        : updateOutlet(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["identity-merchant-outlets", clientId] });
    },
  });
}

// --- Merchant logins --------------------------------------------------------

export function useMerchantLogins(clientId: number | null) {
  return useQuery({
    queryKey: ["identity-merchant-logins", clientId],
    queryFn: () => listMerchantLogins(clientId as number),
    enabled: clientId !== null,
  });
}

export function useCreateMerchantLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      clientId,
      payload,
    }: {
      clientId: number;
      payload: CreateMerchantLoginPayload;
    }) => createMerchantLogin(clientId, payload),
    onSuccess: (_login, { clientId }) => {
      queryClient.invalidateQueries({
        queryKey: ["identity-merchant-logins", clientId],
      });
    },
  });
}

export function useUpdateMerchantLogin(clientId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: UpdateMerchantLoginPayload;
    }) => updateMerchantLogin(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["identity-merchant-logins", clientId],
      });
    },
  });
}

export function useSetMerchantLoginPassword() {
  return useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      setMerchantLoginPassword(id, password),
  });
}

// --- API keys ---------------------------------------------------------------

export function useApiKeys(clientId: number | null) {
  return useQuery({
    queryKey: ["identity-api-keys", clientId],
    queryFn: () => listApiKeys(clientId as number),
    enabled: clientId !== null,
  });
}

/**
 * The mutation result holds the only copy of the secret. It is deliberately not
 * written into the query cache: the list endpoint cannot return it, so a cache
 * that carried it would disagree with the server the moment anything refetched.
 */
export function useIssueApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      clientId,
      environment,
      rateLimitPerMinute,
    }: {
      clientId: number;
      environment: ApiKeyEnvironment;
      rateLimitPerMinute: number;
    }) => issueApiKey(clientId, environment, rateLimitPerMinute),
    onSuccess: (_key, { clientId }) => {
      queryClient.invalidateQueries({ queryKey: ["identity-api-keys", clientId] });
    },
  });
}

export function useRevokeApiKey(clientId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (keyId: number) => revokeApiKey(keyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["identity-api-keys", clientId] });
    },
  });
}

// --- Roles and permissions --------------------------------------------------

export function usePermissions() {
  return useQuery({
    queryKey: ["identity-permissions"],
    queryFn: listPermissions,
    // The catalogue only changes when a migration ships one.
    staleTime: 60 * 60 * 1000,
  });
}

export function useRoles(guardName?: string) {
  return useQuery({
    queryKey: ["identity-roles", guardName ?? "all"],
    queryFn: () => listRoles(guardName),
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRolePayload) => createRole(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["identity-roles"] }),
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateRolePayload }) =>
      updateRole(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["identity-roles"] }),
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roleId: number) => deleteRole(roleId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["identity-roles"] }),
  });
}
