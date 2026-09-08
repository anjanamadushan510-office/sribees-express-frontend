import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createClientOrder,
  getClientOrder,
  listClientOrders,
  getClientOrderHistory,
} from "@/lib/api/orders";
import { getClientCities, getClientStatusTypes } from "@/lib/api/dropdowns";
import type { ClientOrdersListParams, CreateClientOrderPayload } from "@/types/order";

export function useClientOrders(params: ClientOrdersListParams) {
  return useQuery({
    queryKey: ["client-orders", params],
    queryFn: () => listClientOrders(params),
    placeholderData: keepPreviousData,
  });
}

export function useClientOrder(id: number | string) {
  return useQuery({
    queryKey: ["client-order", String(id)],
    queryFn: () => getClientOrder(id),
    enabled: !!id,
  });
}

export function useClientOrderTracking(id: number | string) {
  return useQuery({
    queryKey: ["client-order-history", String(id)],
    queryFn: () => getClientOrderHistory(id),
    enabled: !!id,
  });
}

export function useClientStatusTypes() {
  return useQuery({
    queryKey: ["client-status-types"],
    queryFn: getClientStatusTypes,
    staleTime: 60 * 60 * 1000, // status list rarely changes
  });
}

export function useClientCities() {
  return useQuery({
    queryKey: ["client-cities"],
    queryFn: getClientCities,
    staleTime: 60 * 60 * 1000,
  });
}

export function useCreateClientOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateClientOrderPayload) => createClientOrder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-orders"] });
    },
  });
}
