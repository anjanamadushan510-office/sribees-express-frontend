import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  approveDeposit,
  getRiderDeposit,
  listRiderDeposits,
  makeDepositPayment,
  rejectDeposit,
} from "@/lib/api/admin-rider-finances";
import type {
  ApproveDepositPayload,
  MakePaymentPayload,
  RejectDepositPayload,
  RiderDepositListParams,
} from "@/types/admin-rider-finance";

export function useRiderDeposits(params: RiderDepositListParams) {
  return useQuery({
    queryKey: ["admin-rider-deposits", params],
    queryFn: () => listRiderDeposits(params),
    placeholderData: keepPreviousData,
  });
}

export function useRiderDeposit(id: number | string | null) {
  return useQuery({
    queryKey: ["admin-rider-deposit", String(id)],
    queryFn: () => getRiderDeposit(id as number | string),
    enabled: id !== null,
  });
}

export function useMakeDepositPayment(id: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: MakePaymentPayload) => makeDepositPayment(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-rider-deposits"] });
      queryClient.invalidateQueries({ queryKey: ["admin-rider-deposit", String(id)] });
    },
  });
}

export function useApproveDeposit(id: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ApproveDepositPayload) => approveDeposit(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-rider-deposits"] });
      queryClient.invalidateQueries({ queryKey: ["admin-rider-deposit", String(id)] });
    },
  });
}

export function useRejectDeposit(id: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RejectDepositPayload) => rejectDeposit(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-rider-deposits"] });
      queryClient.invalidateQueries({ queryKey: ["admin-rider-deposit", String(id)] });
    },
  });
}
