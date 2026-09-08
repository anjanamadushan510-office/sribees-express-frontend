import { api, pickKey, unwrap, unwrapPaginated } from "@/lib/api/client";
import type { ApiResponse, Paginated } from "@/types/api";
import type {
  SaveStaffPayload,
  StaffDetail,
  StaffListParams,
  StaffRow,
} from "@/types/admin-staff";

/** GET /api/v1/staff/list — paginated staff directory (excludes delivery riders). */
export async function listStaff(params: StaffListParams): Promise<Paginated<StaffRow>> {
  const res = await api.get<ApiResponse<StaffRow[]>>("/v1/staff/list", {
    params: clean(params),
  });
  return unwrapPaginated<StaffRow>(res);
}

/** GET /api/v1/staff/{staff}. */
export async function getStaffMember(id: number | string): Promise<StaffDetail> {
  const res = await api.get<ApiResponse<unknown>>(`/v1/staff/${id}`);
  const staff = pickKey<StaffDetail>(unwrap(res), "staff");
  if (!staff) throw new Error("Staff member not found");
  return staff;
}

/** POST /api/v1/staff/create. */
export async function createStaffMember(payload: SaveStaffPayload): Promise<void> {
  await api.post("/v1/staff/create", payload);
}

/** PUT /api/v1/staff/update/{staff}. */
export async function updateStaffMember(
  id: number | string,
  payload: SaveStaffPayload
): Promise<void> {
  await api.put(`/v1/staff/update/${id}`, payload);
}

/** PUT /api/v1/staff/status/update/{staff}. */
export async function toggleStaffStatus(
  id: number | string,
  isActive: boolean
): Promise<void> {
  await api.put(`/v1/staff/status/update/${id}`, { is_active: isActive });
}

function clean(params: StaffListParams): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out;
}
