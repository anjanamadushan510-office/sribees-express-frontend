import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  listHOClearance,
  listHOOrders,
  listReversalHistory,
} from "@/lib/api/admin-ho-operations";
import type {
  HOClearanceListParams,
  HOOrderListParams,
  ReversalHistoryListParams,
} from "@/types/admin-ho-operations";

export function useHOOrders(params: HOOrderListParams) {
  return useQuery({
    queryKey: ["admin-ho-orders", params],
    queryFn: () => listHOOrders(params),
    placeholderData: keepPreviousData,
  });
}

export function useHOClearance(params: HOClearanceListParams) {
  return useQuery({
    queryKey: ["admin-ho-clearance", params],
    queryFn: () => listHOClearance(params),
    placeholderData: keepPreviousData,
  });
}

export function useReversalHistory(params: ReversalHistoryListParams) {
  return useQuery({
    queryKey: ["admin-reversal-history", params],
    queryFn: () => listReversalHistory(params),
    placeholderData: keepPreviousData,
  });
}
