import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getOrder,
  getOrderByWaybill,
  getOrderHistory,
  listOrders,
  transitionOrderStatus,
} from "@/lib/api/admin-orders";
import {
  getBranches,
  getCities,
  getClientsDropdown,
  getPrimaryStatusTypes,
  getSortingLayersDropdown,
} from "@/lib/api/dropdowns";
import { getOrderStatusCatalogue } from "@/lib/api/dashboard";
import type { AdminOrdersListParams, OrderStatusTransition } from "@/types/admin-order";

const REFERENCE_STALE_MS = 60 * 60 * 1000;

export function useAdminOrders(params: AdminOrdersListParams) {
  return useQuery({
    queryKey: ["admin-orders", params],
    queryFn: () => listOrders(params),
    placeholderData: keepPreviousData,
  });
}

export function useAdminOrder(id: number | string) {
  return useQuery({
    queryKey: ["admin-order", String(id)],
    queryFn: () => getOrder(id),
    enabled: !!id,
  });
}

export function useAdminOrderHistory(id: number | string) {
  return useQuery({
    queryKey: ["admin-order-history", String(id)],
    queryFn: () => getOrderHistory(id),
    enabled: !!id,
  });
}

/** Waybill lookup — the one search the staff order surface actually has. */
export function useAdminOrderByWaybill(waybill: string) {
  return useQuery({
    queryKey: ["admin-order-waybill", waybill],
    queryFn: () => getOrderByWaybill(waybill),
    enabled: waybill.trim().length > 0,
    retry: false, // a miss is a 404, and retrying a 404 just delays the answer
  });
}

export function useAdminBranches() {
  return useQuery({
    queryKey: ["admin-branches-dropdown"],
    queryFn: getBranches,
    staleTime: REFERENCE_STALE_MS,
  });
}

export function useAdminCities() {
  return useQuery({
    queryKey: ["admin-cities-dropdown"],
    queryFn: getCities,
    staleTime: REFERENCE_STALE_MS,
  });
}

/**
 * The status catalogue, for the "move to status" control.
 *
 * Reads the client-portal endpoint, which a staff token cannot call, so this
 * currently fails for staff — see docs/API-GAPS.md. The transition control
 * surfaces that rather than offering a list of invented statuses.
 */
export function useAdminStatusCatalogue() {
  return useQuery({
    queryKey: ["order-status-catalogue"],
    queryFn: getOrderStatusCatalogue,
    staleTime: REFERENCE_STALE_MS,
    retry: false,
  });
}

export function useUpdateAdminOrderStatus(orderId: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: OrderStatusTransition) => transitionOrderStatus(orderId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-order", String(orderId)] });
      queryClient.invalidateQueries({ queryKey: ["admin-order-history", String(orderId)] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      // The dashboard counts are derived from order statuses, so a transition
      // invalidates them too.
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-counts"] });
    },
  });
}

// --- Dropdowns with no backend ------------------------------------------------
//
// Still exported because several unported admin screens import them. Each
// resolves to an `unavailable()` call that throws with a named feature, so
// those screens surface "not available yet" through their existing error
// states rather than rendering an empty select that reads as "there are none".
// Retries are off: the answer will not change on a second attempt.

export function useAdminClientsDropdown(search?: string) {
  return useQuery({
    queryKey: ["admin-clients-dropdown", search ?? ""],
    queryFn: () => getClientsDropdown(search),
    retry: false,
  });
}

export function useAdminPrimaryStatusTypes() {
  return useQuery({
    queryKey: ["admin-primary-status-types"],
    queryFn: getPrimaryStatusTypes,
    retry: false,
  });
}

export function useAdminSortingLayers() {
  return useQuery({
    queryKey: ["admin-sorting-layers-dropdown"],
    queryFn: getSortingLayersDropdown,
    retry: false,
  });
}
