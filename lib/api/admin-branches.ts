import { api, pickKey, unwrap, unwrapPaginated } from "@/lib/api/client";
import type { ApiResponse, Paginated } from "@/types/api";
import type {
  BranchDetail,
  BranchListParams,
  BranchRow,
  SaveBranchPayload,
} from "@/types/admin-branch";

/** GET /api/v1/branches/list — paginated branch directory. */
export async function listBranches(params: BranchListParams): Promise<Paginated<BranchRow>> {
  const res = await api.get<ApiResponse<BranchRow[]>>("/v1/branches/list", {
    params: clean(params),
  });
  return unwrapPaginated<BranchRow>(res);
}

/** GET /api/v1/branches/{branch}. */
export async function getBranch(id: number | string): Promise<BranchDetail> {
  const res = await api.get<ApiResponse<unknown>>(`/v1/branches/${id}`);
  const branch = pickKey<BranchDetail>(unwrap(res), "branch");
  if (!branch) throw new Error("Branch not found");
  return branch;
}

/** POST /api/v1/branches/create. */
export async function createBranch(payload: SaveBranchPayload): Promise<void> {
  await api.post("/v1/branches/create", payload);
}

/** PUT /api/v1/branches/update/{branch}. */
export async function updateBranch(
  id: number | string,
  payload: SaveBranchPayload
): Promise<void> {
  await api.put(`/v1/branches/update/${id}`, payload);
}

/** PUT /api/v1/branches/status/update/{branch}. */
export async function toggleBranchStatus(
  id: number | string,
  isActive: boolean
): Promise<void> {
  await api.put(`/v1/branches/status/update/${id}`, { is_active: isActive });
}

function clean(params: BranchListParams): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    out[k] = v;
  }
  return out;
}
