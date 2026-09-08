/** A row from GET /api/v1/branches/list (BranchListAction). */
export interface BranchRow {
  id: number;
  name: string;
  address: string;
  status: "active" | "deactivated";
  phone_no: string;
}

/** GET /api/v1/branches/{branch} → data.branch. */
export interface BranchDetail {
  id: number;
  name: string;
  address: string;
  isActive: boolean;
  phone_no: string;
  cities: { id: number; name_en: string }[];
}

export interface BranchListParams {
  page?: number;
  perPage?: number;
  orderBy?: "name" | "address" | "status" | "created_at";
  orderByDirection?: "asc" | "desc";
  branch_name?: string;
  address?: string;
}

/** Payload for POST /api/v1/branches/create and PUT /api/v1/branches/update/{branch}. */
export interface SaveBranchPayload {
  name: string;
  address: string;
  city_ids: number[];
  phone_no: string;
}
