import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createStaffMember,
  getStaffMember,
  listStaff,
  toggleStaffStatus,
  updateStaffMember,
} from "@/lib/api/admin-staff";
import { getRolesDropdown } from "@/lib/api/dropdowns";
import type { SaveStaffPayload, StaffListParams } from "@/types/admin-staff";

export function useStaffList(params: StaffListParams) {
  return useQuery({
    queryKey: ["admin-staff", params],
    queryFn: () => listStaff(params),
    placeholderData: keepPreviousData,
  });
}

export function useStaffMember(id: number | string | null) {
  return useQuery({
    queryKey: ["admin-staff-member", String(id)],
    queryFn: () => getStaffMember(id as number | string),
    enabled: id !== null,
  });
}

export function useRolesDropdown() {
  return useQuery({
    queryKey: ["admin-roles-dropdown"],
    queryFn: getRolesDropdown,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateStaffMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveStaffPayload) => createStaffMember(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-staff"] }),
  });
}

export function useUpdateStaffMember(id: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveStaffPayload) => updateStaffMember(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-staff"] });
      queryClient.invalidateQueries({ queryKey: ["admin-staff-member", String(id)] });
    },
  });
}

export function useToggleStaffStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number | string; isActive: boolean }) =>
      toggleStaffStatus(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-staff"] }),
  });
}
