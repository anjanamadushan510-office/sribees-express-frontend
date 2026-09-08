import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  generateClientApiToken,
  getClientApiInfo,
  getClientFinance,
  getClientInfoMeta,
  getClientInformation,
  getClientMarketing,
  getClientTax,
  listAdminClients,
  toggleClientStatus,
  toggleClientWebhook,
  updateClientFinance,
  updateClientMarketing,
  updateClientTax,
  updateRegisteredDetails,
  updateTraining,
  updateWaybillSettings,
} from "@/lib/api/admin-clients";
import { getStaffDropdown, getTaxTypesDropdown } from "@/lib/api/dropdowns";
import type {
  AdminClientListParams,
  UpdateFinancePayload,
  UpdateMarketingPayload,
  UpdateRegisteredDetailsPayload,
  UpdateTaxPayload,
  UpdateTrainingPayload,
  UpdateWaybillSettingsPayload,
} from "@/types/admin-client";

export function useAdminClients(params: AdminClientListParams) {
  return useQuery({
    queryKey: ["admin-clients", params],
    queryFn: () => listAdminClients(params),
    placeholderData: keepPreviousData,
  });
}

/**
 * There's no single dedicated "get one client" endpoint for the summary
 * fields (client_no, name, email, address, bank details, status) — the list
 * endpoint accepts a `client_id` filter, so reuse it to fetch exactly one row.
 */
export function useAdminClientRow(id: number | string | null) {
  return useQuery({
    queryKey: ["admin-client-row", String(id)],
    queryFn: async () => {
      const res = await listAdminClients({
        client_id: Number(id),
        page: 1,
        perPage: 1,
      });
      return res.items[0] ?? null;
    },
    enabled: id !== null,
  });
}

export function useToggleClientStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      isActive,
      remark,
    }: {
      id: number | string;
      isActive: boolean;
      remark?: string;
    }) => toggleClientStatus(id, isActive, remark),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
      queryClient.invalidateQueries({
        queryKey: ["admin-client-row", String(variables.id)],
      });
    },
  });
}

export function useStaffDropdown(search?: string) {
  return useQuery({
    queryKey: ["admin-staff-dropdown", search ?? ""],
    queryFn: () => getStaffDropdown(search),
    placeholderData: keepPreviousData,
  });
}

export function useTaxTypesDropdown() {
  return useQuery({
    queryKey: ["admin-tax-types-dropdown"],
    queryFn: getTaxTypesDropdown,
    staleTime: 60 * 60 * 1000,
  });
}

// --- Client info / waybill settings / registration ---

export function useClientInfoMeta(id: number | string | null) {
  return useQuery({
    queryKey: ["admin-client-info-meta", String(id)],
    queryFn: () => getClientInfoMeta(id as number | string),
    enabled: id !== null,
  });
}

export function useUpdateTraining(id: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateTrainingPayload) => updateTraining(id, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-client-info-meta", String(id)] }),
  });
}

export function useClientInformation(id: number | string | null) {
  return useQuery({
    queryKey: ["admin-client-information", String(id)],
    queryFn: () => getClientInformation(id as number | string),
    enabled: id !== null,
  });
}

export function useUpdateWaybillSettings(id: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateWaybillSettingsPayload) => updateWaybillSettings(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-client-information", String(id)] });
      queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
    },
  });
}

export function useUpdateRegisteredDetails(id: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateRegisteredDetailsPayload) =>
      updateRegisteredDetails(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-client-information", String(id)] });
      queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
    },
  });
}

// --- Finance ---

export function useClientFinance(id: number | string | null) {
  return useQuery({
    queryKey: ["admin-client-finance", String(id)],
    queryFn: () => getClientFinance(id as number | string),
    enabled: id !== null,
  });
}

export function useUpdateClientFinance(id: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateFinancePayload) => updateClientFinance(id, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-client-finance", String(id)] }),
  });
}

// --- Tax ---

export function useClientTax(id: number | string | null) {
  return useQuery({
    queryKey: ["admin-client-tax", String(id)],
    queryFn: () => getClientTax(id as number | string),
    enabled: id !== null,
  });
}

export function useUpdateClientTax(id: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateTaxPayload) => updateClientTax(id, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-client-tax", String(id)] }),
  });
}

// --- Marketing ---

export function useClientMarketing(id: number | string | null) {
  return useQuery({
    queryKey: ["admin-client-marketing", String(id)],
    queryFn: () => getClientMarketing(id as number | string),
    enabled: id !== null,
  });
}

export function useUpdateClientMarketing(id: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateMarketingPayload) => updateClientMarketing(id, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-client-marketing", String(id)] }),
  });
}

// --- API / webhook ---

export function useClientApiInfo(id: number | string | null) {
  return useQuery({
    queryKey: ["admin-client-api", String(id)],
    queryFn: () => getClientApiInfo(id as number | string),
    enabled: id !== null,
  });
}

export function useGenerateClientApiToken(id: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => generateClientApiToken(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-client-api", String(id)] }),
  });
}

export function useToggleClientWebhook(id: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (isActive: boolean) => toggleClientWebhook(id, isActive),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-client-api", String(id)] }),
  });
}
