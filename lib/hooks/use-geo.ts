import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignPostOfficesToCity,
  listCities,
  listPostOfficeRegions,
  listPostOffices,
  updatePostOffice,
} from "@/lib/api/admin-geo";
import type { PostOfficeAssign, PostOfficeListParams } from "@/types/admin-geo";

/** Cities are the operational grouping a post office gets attached to. */
export function useGeoCities() {
  return useQuery({ queryKey: ["geo-cities"], queryFn: listCities });
}

export function usePostOffices(params: PostOfficeListParams = {}) {
  return useQuery({
    queryKey: ["geo-post-offices", params],
    queryFn: () => listPostOffices(params),
    placeholderData: (previous) => previous,
  });
}

export function usePostOfficeRegions() {
  return useQuery({
    queryKey: ["geo-post-office-regions"],
    queryFn: listPostOfficeRegions,
  });
}

function invalidatePostOffices(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["geo-post-offices"] });
  // The per-district counts are the whole point of the screen, so they must
  // not survive a change to what they are counting.
  queryClient.invalidateQueries({ queryKey: ["geo-post-office-regions"] });
}

export function useAssignPostOffices() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PostOfficeAssign) => assignPostOfficesToCity(payload),
    onSuccess: () => invalidatePostOffices(queryClient),
  });
}

export function useUpdatePostOffice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: { city_id?: number | null; is_active?: boolean };
    }) => updatePostOffice(id, payload),
    onSuccess: () => invalidatePostOffices(queryClient),
  });
}
