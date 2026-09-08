import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createBranch,
  getBranch,
  listBranches,
  toggleBranchStatus,
  updateBranch,
} from "@/lib/api/admin-branches";
import type { BranchListParams, SaveBranchPayload } from "@/types/admin-branch";

export function useBranches(params: BranchListParams) {
  return useQuery({
    queryKey: ["admin-branches", params],
    queryFn: () => listBranches(params),
    placeholderData: keepPreviousData,
  });
}

export function useBranch(id: number | string | null) {
  return useQuery({
    queryKey: ["admin-branch", String(id)],
    queryFn: () => getBranch(id as number | string),
    enabled: id !== null,
  });
}

export function useCreateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveBranchPayload) => createBranch(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-branches"] }),
  });
}

export function useUpdateBranch(id: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveBranchPayload) => updateBranch(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-branches"] });
      queryClient.invalidateQueries({ queryKey: ["admin-branch", String(id)] });
    },
  });
}

export function useToggleBranchStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number | string; isActive: boolean }) =>
      toggleBranchStatus(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-branches"] }),
  });
}
