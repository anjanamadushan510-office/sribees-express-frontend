/** A row from GET /api/v1/riders/list (RiderListAction). */
export interface RiderRow {
  id: number;
  rider_name: string;
  contract_type: "staff" | "freelance";
  branch_name: string;
  created_by: string | null;
  deactivated_by: string | null;
  deactivated_date: string | null;
  status: "new" | "active" | "deactivated" | string;
}

export interface RiderListParams {
  page?: number;
  perPage?: number;
  orderBy?: "id" | "name" | "created_at";
  orderByDirection?: "asc" | "desc";
  status?: string[];
  rider_name?: string;
  branch_name?: string;
}

/** GET /api/v1/riders/{staff} → data.rider. */
export interface RiderDetail {
  id: number;
  name: string;
  nic: string;
  address: string;
  email: string;
  contact_no: string;
  contract_type: "staff" | "freelance";
  created_at: string;
  updated_at: string;
  branch: { branch_id: number; name: string }[];
}

/** Payload for POST /api/v1/riders/create and PUT /api/v1/riders/update/{staff}. */
export interface SaveRiderPayload {
  name: string;
  nic: string;
  address: string;
  contact_no: string;
  branch_id: number;
  contract_type: "staff" | "freelance";
  email: string;
  password?: string;
  password_confirmation?: string;
}
