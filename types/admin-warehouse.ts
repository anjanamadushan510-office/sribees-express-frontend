/** GET /warehouse/bags — a sealed sack of orders moving between branches. */
export interface Bag {
  id: number;
  origin_branch_id: number;
  destination_branch_id: number;
  status: string;
  created_at: string;
  closed_at: string | null;
  order_ids: number[];
}

export interface BagCreate {
  origin_branch_id: number;
  destination_branch_id: number;
}

/** A physical pigeonhole at a branch, mapped to a destination postal city. */
export interface SortingBucket {
  id: number;
  branch_id: number;
  code: string;
  destination_postal_city_id: number | null;
  is_active: boolean;
}

export interface SortingBucketCreate {
  branch_id: number;
  code: string;
  destination_postal_city_id?: number | null;
}
