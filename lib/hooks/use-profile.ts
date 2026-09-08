import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyProfile, updateAccount, updatePassword } from "@/lib/api/profile";
import type { UpdateAccountPayload, UpdatePasswordPayload } from "@/types/profile";

export function useMyProfile() {
  return useQuery({
    queryKey: ["my-profile"],
    queryFn: getMyProfile,
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateAccountPayload) => updateAccount(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-profile"] }),
  });
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: (payload: UpdatePasswordPayload) => updatePassword(payload),
  });
}
