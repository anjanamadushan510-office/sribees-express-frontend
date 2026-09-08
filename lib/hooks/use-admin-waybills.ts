import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  createWaybillRequest,
  getNextAvailableWaybillStart,
  listWaybillRequests,
  rejectWaybillRequest,
  restoreWaybillRequest,
  toggleWaybillRequestStatus,
} from "@/lib/api/admin-waybills";
import type {
  CreateWaybillRequestPayload,
  WaybillRequestListParams,
} from "@/types/admin-waybill";

export function useWaybillRequests(params: WaybillRequestListParams) {
  return useQuery({
    queryKey: ["admin-waybill-requests", params],
    queryFn: () => listWaybillRequests(params),
    placeholderData: keepPreviousData,
  });
}

export function useNextAvailableWaybillStart(enabled: boolean) {
  return useQuery({
    queryKey: ["admin-next-waybill-start"],
    queryFn: getNextAvailableWaybillStart,
    enabled,
    staleTime: 0,
  });
}

export function useCreateWaybillRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateWaybillRequestPayload) => createWaybillRequest(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-waybill-requests"] }),
  });
}

export function useToggleWaybillRequestStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number | string; isActive: boolean }) =>
      toggleWaybillRequestStatus(id, isActive),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-waybill-requests"] }),
  });
}

export function useRejectWaybillRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => rejectWaybillRequest(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-waybill-requests"] }),
  });
}

export function useRestoreWaybillRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => restoreWaybillRequest(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-waybill-requests"] }),
  });
}
