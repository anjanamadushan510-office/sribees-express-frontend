import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  clearAllOrder,
  clearTodayOrder,
  listAllOrderClear,
  listTodayOrderClear,
} from "@/lib/api/admin-order-clearing";
import type {
  AllOrderClearListParams,
  TodayOrderClearListParams,
} from "@/types/admin-order-clearing";

export function useTodayOrderClear(params: TodayOrderClearListParams) {
  return useQuery({
    queryKey: ["admin-today-order-clear", params],
    queryFn: () => listTodayOrderClear(params),
    placeholderData: keepPreviousData,
  });
}

export function useAllOrderClear(params: AllOrderClearListParams) {
  return useQuery({
    queryKey: ["admin-all-order-clear", params],
    queryFn: () => listAllOrderClear(params),
    placeholderData: keepPreviousData,
  });
}

export function useClearTodayOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (waybillId: string) => clearTodayOrder(waybillId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-today-order-clear"] }),
  });
}

export function useClearAllOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (waybillId: string) => clearAllOrder(waybillId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-all-order-clear"] }),
  });
}
