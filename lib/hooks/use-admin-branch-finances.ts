import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  acceptBranchDepositPayment,
  approveBranchDeposit,
  approveBranchExpense,
  createBranchDeposit,
  getAcceptPaymentView,
  getBranchDeposit,
  getBranchDepositEditInfo,
  getBranchExpenseUpdateDetail,
  getBranchWaybillOptions,
  listBranchDeposits,
  listBranchExpenseApprovals,
  rejectBranchDeposit,
  rejectBranchExpense,
  updateBranchDeposit,
} from "@/lib/api/admin-branch-finances";
import type {
  AcceptPaymentPayload,
  BranchDepositListParams,
  BranchExpenseApprovalListParams,
  CreateBranchDepositPayload,
  UpdateBranchDepositPayload,
} from "@/types/admin-branch-finance";

export function useBranchDeposits(params: BranchDepositListParams) {
  return useQuery({
    queryKey: ["admin-branch-deposits", params],
    queryFn: () => listBranchDeposits(params),
    placeholderData: keepPreviousData,
  });
}

export function useBranchDeposit(id: number | string | null) {
  return useQuery({
    queryKey: ["admin-branch-deposit", String(id)],
    queryFn: () => getBranchDeposit(id as number | string),
    enabled: id !== null,
  });
}

export function useApproveBranchDeposit(id: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => approveBranchDeposit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-branch-deposits"] });
      queryClient.invalidateQueries({ queryKey: ["admin-branch-deposit", String(id)] });
    },
  });
}

export function useRejectBranchDeposit(id: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => rejectBranchDeposit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-branch-deposits"] });
      queryClient.invalidateQueries({ queryKey: ["admin-branch-deposit", String(id)] });
    },
  });
}

export function useBranchWaybillOptions(branchId: number | string | null) {
  return useQuery({
    queryKey: ["admin-branch-waybill-options", String(branchId)],
    queryFn: () => getBranchWaybillOptions(branchId as number | string),
    enabled: !!branchId,
  });
}

export function useCreateBranchDeposit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBranchDepositPayload) => createBranchDeposit(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-branch-deposits"] });
    },
  });
}

export function useBranchDepositEditInfo(id: number | string | null) {
  return useQuery({
    queryKey: ["admin-branch-deposit-edit", String(id)],
    queryFn: () => getBranchDepositEditInfo(id as number | string),
    enabled: id !== null,
  });
}

export function useUpdateBranchDeposit(id: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateBranchDepositPayload) => updateBranchDeposit(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-branch-deposits"] });
      queryClient.invalidateQueries({ queryKey: ["admin-branch-deposit", String(id)] });
    },
  });
}

export function useAcceptPaymentView(id: number | string | null) {
  return useQuery({
    queryKey: ["admin-branch-deposit-accept-payment-view", String(id)],
    queryFn: () => getAcceptPaymentView(id as number | string),
    enabled: id !== null,
  });
}

export function useAcceptBranchDepositPayment(id: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AcceptPaymentPayload) => acceptBranchDepositPayment(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-branch-deposits"] });
      queryClient.invalidateQueries({ queryKey: ["admin-branch-deposit", String(id)] });
    },
  });
}

export function useBranchExpenseApprovals(params: BranchExpenseApprovalListParams) {
  return useQuery({
    queryKey: ["admin-branch-expense-approvals", params],
    queryFn: () => listBranchExpenseApprovals(params),
    placeholderData: keepPreviousData,
  });
}

export function useBranchExpenseUpdateDetail(
  depositId: number | string | null,
  expenseStatus: "pending" | "rejected" | "approved" = "pending"
) {
  return useQuery({
    queryKey: ["admin-branch-expense-update-detail", String(depositId), expenseStatus],
    queryFn: () => getBranchExpenseUpdateDetail(depositId as number | string, expenseStatus),
    enabled: depositId !== null,
  });
}

export function useApproveBranchExpense(depositId: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => approveBranchExpense(depositId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-branch-expense-approvals"] });
      queryClient.invalidateQueries({
        queryKey: ["admin-branch-expense-update-detail", String(depositId)],
      });
      queryClient.invalidateQueries({ queryKey: ["admin-branch-deposit", String(depositId)] });
    },
  });
}

export function useRejectBranchExpense(depositId: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => rejectBranchExpense(depositId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-branch-expense-approvals"] });
      queryClient.invalidateQueries({
        queryKey: ["admin-branch-expense-update-detail", String(depositId)],
      });
      queryClient.invalidateQueries({ queryKey: ["admin-branch-deposit", String(depositId)] });
    },
  });
}
