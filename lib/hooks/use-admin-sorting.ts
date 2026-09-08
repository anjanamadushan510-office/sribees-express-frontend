import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  closeSortingBucket,
  createBag,
  endOfShift,
  getCurrentBag,
  getDeviceSettings,
  getShiftType,
  getSortingBucketOptions,
  getSortingCount,
  holdOrder,
  listBucketCloseHoldOrders,
  listCityAssignOrders,
  listHoldOrders,
  listOpenSortingBuckets,
  listSortingBuckets,
  openSortingBucket,
  processOrderHold,
  updateDeviceSettings,
  updateOrderCity,
} from "@/lib/api/admin-sorting";
import type {
  CityAssignListParams,
  OpenSortingBucketPayload,
  SortingBucketListParams,
  SortingCountParams,
  UpdateDeviceSettingsPayload,
  UpdateOrderCityPayload,
} from "@/types/admin-sorting";

export function useCityAssignOrders(params: CityAssignListParams) {
  return useQuery({
    queryKey: ["admin-city-assign-orders", params],
    queryFn: () => listCityAssignOrders(params),
    placeholderData: keepPreviousData,
  });
}

export function useUpdateOrderCity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateOrderCityPayload) => updateOrderCity(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-city-assign-orders"] }),
  });
}

export function useSortingCount(params: SortingCountParams) {
  return useQuery({
    queryKey: ["admin-sorting-count", params],
    queryFn: () => getSortingCount(params),
    staleTime: 60 * 1000,
  });
}

export function useSortingBuckets(params: SortingBucketListParams) {
  return useQuery({
    queryKey: ["admin-sorting-buckets", params],
    queryFn: () => listSortingBuckets(params),
    placeholderData: keepPreviousData,
  });
}

export function useOpenSortingBuckets(params: SortingBucketListParams) {
  return useQuery({
    queryKey: ["admin-sorting-buckets-open", params],
    queryFn: () => listOpenSortingBuckets(params),
    placeholderData: keepPreviousData,
  });
}

export function useShiftType() {
  return useQuery({
    queryKey: ["admin-sorting-shift-type"],
    queryFn: getShiftType,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSortingBucketOptions(sortingCenterId: number | string | null) {
  return useQuery({
    queryKey: ["admin-sorting-bucket-options", String(sortingCenterId)],
    queryFn: () => getSortingBucketOptions(sortingCenterId as number | string),
    enabled: !!sortingCenterId,
  });
}

export function useOpenSortingBucket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: OpenSortingBucketPayload) => openSortingBucket(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-sorting-buckets"] });
      queryClient.invalidateQueries({ queryKey: ["admin-sorting-buckets-open"] });
    },
  });
}

export function useCloseSortingBucket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bucketId: number | string) => closeSortingBucket(bucketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-sorting-buckets"] });
      queryClient.invalidateQueries({ queryKey: ["admin-sorting-buckets-open"] });
    },
  });
}

export function useHoldOrders(layerId: number | string | null, search?: string) {
  return useQuery({
    queryKey: ["admin-hold-orders", String(layerId), search ?? ""],
    queryFn: () => listHoldOrders(layerId as number | string, search),
    enabled: !!layerId,
  });
}

export function useHoldOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (waybillId: string) => holdOrder(waybillId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-hold-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-bucket-close-hold-orders"] });
    },
  });
}

export function useDeviceSettings() {
  return useQuery({
    queryKey: ["admin-device-settings"],
    queryFn: getDeviceSettings,
  });
}

export function useUpdateDeviceSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateDeviceSettingsPayload) => updateDeviceSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-device-settings"] });
    },
  });
}

export function useCurrentBag(layerId: number | string | null) {
  return useQuery({
    queryKey: ["admin-current-bag", String(layerId)],
    queryFn: () => getCurrentBag(layerId as number | string),
    enabled: !!layerId,
  });
}

export function useCreateBag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (layerId: number | string) => createBag(layerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-current-bag"] });
    },
  });
}

export function useBucketCloseHoldOrders(layerId: number | string | null) {
  return useQuery({
    queryKey: ["admin-bucket-close-hold-orders", String(layerId)],
    queryFn: () => listBucketCloseHoldOrders(layerId as number | string),
    enabled: !!layerId,
  });
}

export function useProcessOrderHold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (waybillId: string) => processOrderHold(waybillId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bucket-close-hold-orders"] });
    },
  });
}

export function useEndOfShift() {
  return useMutation({
    mutationFn: (layerId: number | string) => endOfShift(layerId),
  });
}
