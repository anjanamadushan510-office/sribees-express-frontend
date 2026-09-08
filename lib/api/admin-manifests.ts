import { api, unwrapPaginated } from "@/lib/api/client";
import type { ApiResponse, Paginated } from "@/types/api";
import type {
  BranchManifestListParams,
  ClearedManifestRow,
  ReturnClientManifestRow,
  ReturnHOManifestListParams,
  RiderManifestListParams,
  RiderManifestRow,
} from "@/types/admin-manifest";

/** GET /api/v1/manifest/branch-manifest/list. */
export async function listBranchManifest(
  params: BranchManifestListParams
): Promise<Paginated<ClearedManifestRow>> {
  const res = await api.get<ApiResponse<ClearedManifestRow[]>>(
    "/v1/manifest/branch-manifest/list",
    { params: clean(params) }
  );
  return unwrapPaginated<ClearedManifestRow>(res);
}

/** GET /api/v1/manifest/rider-manifest/list. */
export async function listRiderManifest(
  params: RiderManifestListParams
): Promise<Paginated<RiderManifestRow>> {
  const res = await api.get<ApiResponse<RiderManifestRow[]>>(
    "/v1/manifest/rider-manifest/list",
    { params: clean(params) }
  );
  return unwrapPaginated<RiderManifestRow>(res);
}

/** GET /api/v1/manifest/return-ho-manifest/list. */
export async function listReturnHOManifest(
  params: ReturnHOManifestListParams
): Promise<Paginated<ClearedManifestRow>> {
  const res = await api.get<ApiResponse<ClearedManifestRow[]>>(
    "/v1/manifest/return-ho-manifest/list",
    { params: clean(params) }
  );
  return unwrapPaginated<ClearedManifestRow>(res);
}

/** GET /api/v1/manifest/different-destination-manifest/list. */
export async function listDDManifest(
  params: ReturnHOManifestListParams
): Promise<Paginated<ClearedManifestRow>> {
  const res = await api.get<ApiResponse<ClearedManifestRow[]>>(
    "/v1/manifest/different-destination-manifest/list",
    { params: clean(params) }
  );
  return unwrapPaginated<ClearedManifestRow>(res);
}

/** GET /api/v1/manifest/return-to-client-manifest/list. */
export async function listReturnClientManifest(
  params: ReturnHOManifestListParams
): Promise<Paginated<ReturnClientManifestRow>> {
  const res = await api.get<ApiResponse<ReturnClientManifestRow[]>>(
    "/v1/manifest/return-to-client-manifest/list",
    { params: clean(params) }
  );
  return unwrapPaginated<ReturnClientManifestRow>(res);
}

function clean<T extends object>(params: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    out[k] = v;
  }
  return out;
}
