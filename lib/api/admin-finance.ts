import { api, get } from "@/lib/api/client";
import type {
  BranchDeposit,
  BranchDepositCreate,
  RiderDeposit,
  RiderDepositCreate,
} from "@/types/admin-finance";

/**
 * Cash-handling: deposits made by riders and branches, and their approval.
 *
 * Approve and reject are POSTs with no body — the actor is the authenticated
 * staff member, which the server takes from the token rather than trusting the
 * client to name. Both return the updated row, so a list can be reconciled
 * from the response instead of refetched blindly.
 */

// --- Branch deposits ---------------------------------------------------------
export const listBranchDeposits = () =>
  get<BranchDeposit[]>("/finance/branch-deposits");

export async function createBranchDeposit(
  payload: BranchDepositCreate
): Promise<BranchDeposit> {
  const { data } = await api.post<BranchDeposit>("/finance/branch-deposits", payload);
  return data;
}

export async function approveBranchDeposit(id: number): Promise<BranchDeposit> {
  const { data } = await api.post<BranchDeposit>(
    `/finance/branch-deposits/${id}/approve`,
    {}
  );
  return data;
}

export async function rejectBranchDeposit(id: number): Promise<BranchDeposit> {
  const { data } = await api.post<BranchDeposit>(
    `/finance/branch-deposits/${id}/reject`,
    {}
  );
  return data;
}

// --- Rider deposits ----------------------------------------------------------
export const listRiderDeposits = () => get<RiderDeposit[]>("/finance/rider-deposits");

export async function createRiderDeposit(
  payload: RiderDepositCreate
): Promise<RiderDeposit> {
  const { data } = await api.post<RiderDeposit>("/finance/rider-deposits", payload);
  return data;
}

export async function approveRiderDeposit(id: number): Promise<RiderDeposit> {
  const { data } = await api.post<RiderDeposit>(
    `/finance/rider-deposits/${id}/approve`,
    {}
  );
  return data;
}

export async function rejectRiderDeposit(id: number): Promise<RiderDeposit> {
  const { data } = await api.post<RiderDeposit>(
    `/finance/rider-deposits/${id}/reject`,
    {}
  );
  return data;
}
