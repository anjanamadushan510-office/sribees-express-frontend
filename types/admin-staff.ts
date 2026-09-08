/** A row from GET /api/v1/staff/list (StaffListAction). */
export interface StaffRow {
  id: number;
  staff_name: string;
  role_name: string | null;
  nic: string;
  email: string;
  created_by: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
  branch_count: number;
  branch_name: string | null;
}

export interface StaffListParams {
  page?: number;
  perPage?: number;
  orderBy?: "id" | "name" | "nic" | "email" | "created_at" | "updated_at";
  orderByDirection?: "asc" | "desc";
  status?: string[];
  staff_name?: string;
  role?: string;
  nic?: string;
  email?: string;
}

/** GET /api/v1/staff/{staff} → data.staff. */
export interface StaffDetail {
  id: number;
  name: string;
  nic: string;
  address: string;
  email: string;
  contact_no: string;
  created_at: string;
  updated_at: string;
  created_by: number | null;
  updated_by: number | null;
  roles: { id: number; name: string }[];
  clients: { client_id: number; name: string }[];
  branch: { branch_id: number; name: string }[];
}

/** Payload for POST /api/v1/staff/create and PUT /api/v1/staff/update/{staff}. */
export interface SaveStaffPayload {
  name: string;
  nic: string;
  address: string;
  email: string;
  contact_no: string;
  role_id: number;
  branch_ids: number[];
  client_ids?: number[];
  password?: string;
  password_confirmation?: string;
}
