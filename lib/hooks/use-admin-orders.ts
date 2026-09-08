import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createAdminOrder,
  createAdminOrderManualWaybill,
  createAdminOrderRemark,
  getAdminOrder,
  holdAdminOrder,
  listAdminOrders,
  updateAdminOrderStatus,
} from "@/lib/api/admin-orders";
import {
  getBranches,
  getCities,
  getClientsDropdown,
  getPrimaryStatusTypes,
  getSortingLayersDropdown,
} from "@/lib/api/dropdowns";
import type {
  AdminOrdersListParams,
  CreateAdminOrderManualWaybillPayload,
  CreateAdminOrderPayload,
  CreateOrderRemarkPayload,
  UpdateOrderStatusPayload,
} from "@/types/admin-order";

export function useAdminOrders(params: AdminOrdersListParams) {
  return useQuery({
    queryKey: ["admin-orders", params],
    queryFn: () => listAdminOrders(params),
    placeholderData: keepPreviousData,
  });
}

export function useAdminOrder(id: number | string) {
  return useQuery({
    queryKey: ["admin-order", String(id)],
    queryFn: () => getAdminOrder(id),
    enabled: !!id,
  });
}

export function useAdminPrimaryStatusTypes() {
  return useQuery({
    queryKey: ["admin-primary-status-types"],
    queryFn: getPrimaryStatusTypes,
    staleTime: 60 * 60 * 1000,
  });
}

export function useAdminBranches() {
  return useQuery({
    queryKey: ["admin-branches-dropdown"],
    queryFn: getBranches,
    staleTime: 60 * 60 * 1000,
  });
}

export function useAdminCities() {
  return useQuery({
    queryKey: ["admin-cities-dropdown"],
    queryFn: getCities,
    staleTime: 60 * 60 * 1000,
  });
}

export function useAdminClientsDropdown(search?: string) {
  return useQuery({
    queryKey: ["admin-clients-dropdown", search ?? ""],
    queryFn: () => getClientsDropdown(search),
    placeholderData: keepPreviousData,
  });
}

export function useAdminSortingLayers() {
  return useQuery({
    queryKey: ["admin-sorting-layers-dropdown"],
    queryFn: getSortingLayersDropdown,
    staleTime: 60 * 60 * 1000,
  });
}

export function useCreateAdminOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAdminOrderPayload) => createAdminOrder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
  });
}

export function useCreateAdminOrderManualWaybill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAdminOrderManualWaybillPayload) =>
      createAdminOrderManualWaybill(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
  });
}

export function useUpdateAdminOrderStatus(orderId: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateOrderStatusPayload) => updateAdminOrderStatus(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-order", String(orderId)] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
  });
}

export function useCreateAdminOrderRemark(orderId: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOrderRemarkPayload) => createAdminOrderRemark(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-order", String(orderId)] });
    },
  });
}

export function useHoldAdminOrder(orderId: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => holdAdminOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-order", String(orderId)] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
  });
}
