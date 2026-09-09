/** Amounts are decimal strings throughout — NUMERIC columns, never floats. */
export interface BranchDeposit {
  id: number;
  branch_id: number;
  amount: string;
  status: string;
  approved_by_staff_id: number | null;
  approved_at: string | null;
  created_at: string;
}

export interface RiderDeposit {
  id: number;
  rider_id: number;
  branch_id: number | null;
  amount: string;
  status: string;
  approved_by_staff_id: number | null;
  approved_at: string | null;
  created_at: string;
}

export interface BranchDepositCreate {
  branch_id: number;
  amount: string;
}

export interface RiderDepositCreate {
  rider_id: number;
  branch_id?: number | null;
  amount: string;
}
