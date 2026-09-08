import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClientWaybillRequest, listClientWaybillRequests } from "@/lib/api/waybill-requests";
import type {
  ClientWaybillRequestListParams,
  CreateClientWaybillRequestPayload,
} from "@/types/waybill-request";

export function useClientWaybillRequests(params: ClientWaybillRequestListParams) {
  return useQuery({
    queryKey: ["client-waybill-requests", params],
    queryFn: () => listClientWaybillRequests(params),
    placeholderData: keepPreviousData,
  });
}

export function useCreateClientWaybillRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateClientWaybillRequestPayload) =>
      createClientWaybillRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-waybill-requests"] });
    },
  });
}
