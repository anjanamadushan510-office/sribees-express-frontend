import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createCity,
  createZone,
  getCity,
  getZone,
  listCities,
  listZones,
  toggleCityStatus,
  updateCity,
  updateZone,
} from "@/lib/api/admin-locations";
import { getDistrictDropdown, getZonesDropdown } from "@/lib/api/dropdowns";
import type {
  CityListParams,
  SaveCityPayload,
  SaveZonePayload,
  ZoneListParams,
} from "@/types/admin-location";

// --- Cities ---

export function useCities(params: CityListParams) {
  return useQuery({
    queryKey: ["admin-cities", params],
    queryFn: () => listCities(params),
    placeholderData: keepPreviousData,
  });
}

export function useCity(id: number | string | null) {
  return useQuery({
    queryKey: ["admin-city", String(id)],
    queryFn: () => getCity(id as number | string),
    enabled: id !== null,
  });
}

export function useDistrictsDropdown() {
  return useQuery({
    queryKey: ["admin-districts-dropdown"],
    queryFn: getDistrictDropdown,
    staleTime: 60 * 60 * 1000,
  });
}

export function useZonesDropdown() {
  return useQuery({
    queryKey: ["admin-zones-dropdown"],
    queryFn: getZonesDropdown,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateCity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveCityPayload) => createCity(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-cities"] }),
  });
}

export function useUpdateCity(id: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveCityPayload) => updateCity(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cities"] });
      queryClient.invalidateQueries({ queryKey: ["admin-city", String(id)] });
    },
  });
}

export function useToggleCityStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number | string; isActive: boolean }) =>
      toggleCityStatus(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-cities"] }),
  });
}

// --- Zones ---

export function useZones(params: ZoneListParams) {
  return useQuery({
    queryKey: ["admin-zones", params],
    queryFn: () => listZones(params),
    placeholderData: keepPreviousData,
  });
}

export function useZone(id: number | string | null) {
  return useQuery({
    queryKey: ["admin-zone", String(id)],
    queryFn: () => getZone(id as number | string),
    enabled: id !== null,
  });
}

export function useCreateZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveZonePayload) => createZone(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-zones"] });
      queryClient.invalidateQueries({ queryKey: ["admin-zones-dropdown"] });
    },
  });
}

export function useUpdateZone(id: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveZonePayload) => updateZone(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-zones"] });
      queryClient.invalidateQueries({ queryKey: ["admin-zone", String(id)] });
      queryClient.invalidateQueries({ queryKey: ["admin-zones-dropdown"] });
    },
  });
}
