import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignPostalCitiesToBranch,
  assignPostalCitiesToZone,
  listBranches,
  listPostalCities,
  listPostalCityRegions,
  listZones,
  updatePostalCity,
} from "@/lib/api/admin-geo";
import type {
  PostalCityBranchAssign,
  PostalCityListParams,
  PostalCityZoneAssign,
} from "@/types/admin-geo";

export function useGeoZones() {
  return useQuery({ queryKey: ["geo-zones"], queryFn: listZones });
}

export function useGeoBranches() {
  return useQuery({ queryKey: ["geo-branches"], queryFn: listBranches });
}

export function usePostalCities(params: PostalCityListParams = {}) {
  return useQuery({
    queryKey: ["geo-postal-cities", params],
    queryFn: () => listPostalCities(params),
    placeholderData: (previous) => previous,
  });
}

export function usePostalCityRegions() {
  return useQuery({
    queryKey: ["geo-postal-city-regions"],
    queryFn: listPostalCityRegions,
  });
}

function invalidatePostalCities(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["geo-postal-cities"] });
  // The per-district counts are the whole point of the screen, so they must
  // not survive a change to what they are counting.
  queryClient.invalidateQueries({ queryKey: ["geo-postal-city-regions"] });
}

export function useAssignPostalCitiesToZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PostalCityZoneAssign) => assignPostalCitiesToZone(payload),
    onSuccess: () => invalidatePostalCities(queryClient),
  });
}

export function useAssignPostalCitiesToBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PostalCityBranchAssign) => assignPostalCitiesToBranch(payload),
    onSuccess: () => {
      invalidatePostalCities(queryClient);
      // Branch rows carry a coverage count.
      queryClient.invalidateQueries({ queryKey: ["geo-branches"] });
    },
  });
}

export function useUpdatePostalCity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: { zone_id?: number | null; is_active?: boolean };
    }) => updatePostalCity(id, payload),
    onSuccess: () => invalidatePostalCities(queryClient),
  });
}
