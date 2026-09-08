import { api, pickKey, unwrap } from "@/lib/api/client";
import type { ApiResponse, Pagination } from "@/types/api";
import type { BespokeFilterField, BespokeReportDef, BespokeReportRow } from "@/types/admin-bespoke-report";

const DEFAULT_PAGINATION: Pagination = { total: 0, per_page: 10, current_page: 1, last_page: 1 };

/**
 * Generic fetcher for the ~29 `makePaginatedResponse`-based bespoke report
 * endpoints — standard envelope, `data` is a raw row array. Handles the one
 * confirmed shape bug (`branch-order-pending`'s `data` is double-wrapped,
 * `[[...]]` instead of `[...]`) generically by unwrapping a lone-array
 * first element.
 */
export async function fetchBespokeReport(
  def: BespokeReportDef,
  filterValues: Record<string, string>,
  page: number,
  perPage: number
): Promise<{ items: BespokeReportRow[]; pagination: Pagination }> {
  const pathParamKeys = def.pathParams ?? [];
  const pathSuffix = pathParamKeys
    .map((k) => encodeURIComponent(filterValues[k] ?? ""))
    .join("/");
  const url = `/v1/reports/${def.path}${pathSuffix ? `/${pathSuffix}` : ""}`;

  const queryParams: Record<string, unknown> = { page, perPage };
  for (const field of def.filters) {
    if (pathParamKeys.includes(field.key)) continue;
    const v = filterValues[field.key];
    if (v !== undefined && v !== "") queryParams[field.key] = v;
  }

  const res = await api.get<ApiResponse<BespokeReportRow[]>>(url, { params: queryParams });
  let items = (res.data.data as BespokeReportRow[]) ?? [];
  if (items.length === 1 && Array.isArray(items[0])) {
    items = items[0] as unknown as BespokeReportRow[];
  }
  return { items, pagination: res.data.pagination ?? DEFAULT_PAGINATION };
}

/** POST /v1/reports/audit — mark a waybill (already cleared from manifesto) as audited. */
export async function markWaybillAudited(waybillId: string): Promise<void> {
  await api.post("/v1/reports/audit", { waybill_id: waybillId });
}

/**
 * The 3 `makeReturn()`-based stat/lookup endpoints (not paginated lists).
 * Each returns a small key/value list after `convertToAPIData` reshaping —
 * read every key via `pickKey`.
 */
export async function getClientCountDashboard(): Promise<{
  yearly: number;
  monthly: number;
  weekly: number;
}> {
  const res = await api.get<ApiResponse<unknown>>("/v1/reports/client-count/dashboard");
  const data = unwrap(res);
  return {
    yearly: pickKey<number>(data, "yearly") ?? 0,
    monthly: pickKey<number>(data, "monthly") ?? 0,
    weekly: pickKey<number>(data, "weekly") ?? 0,
  };
}

export async function getPendingInvoiceDashboard(): Promise<{
  total_collected_cod: number;
  total_delivery_charge: number;
  total_commission: number;
  total_payable: number;
  tomorrow_payable: number;
}> {
  const res = await api.get<ApiResponse<unknown>>("/v1/reports/pending-invoice/dashboard");
  const data = unwrap(res);
  return {
    total_collected_cod: pickKey<number>(data, "total_collected_cod") ?? 0,
    total_delivery_charge: pickKey<number>(data, "total_delivery_charge") ?? 0,
    total_commission: pickKey<number>(data, "total_commission") ?? 0,
    total_payable: pickKey<number>(data, "total_payable") ?? 0,
    tomorrow_payable: pickKey<number>(data, "tomorrow_payable") ?? 0,
  };
}

/** GET /v1/reports/sorting-center-branch — {layer name} → {comma-joined branch ids}. */
export async function getSortingCenterBranchMap(): Promise<{ key: string; value: string }[]> {
  const res = await api.get<ApiResponse<{ key: string; value: string }[]>>(
    "/v1/reports/sorting-center-branch"
  );
  return unwrap<{ key: string; value: string }[]>(res) ?? [];
}

/** GET /v1/reports/sorting-report/view/{sortingReport} — index-keyed list of comparison rows. */
export async function getSortingReportView(id: number | string): Promise<BespokeReportRow[]> {
  const res = await api.get<ApiResponse<unknown>>(`/v1/reports/sorting-report/view/${id}`);
  const data = unwrap(res);
  if (Array.isArray(data)) {
    return data
      .map((d) => (d && typeof d === "object" && "value" in d ? (d as { value: unknown }).value : d))
      .filter((v): v is BespokeReportRow => !!v && typeof v === "object");
  }
  return [];
}

/** POST /v1/reports/create-sorting-report. */
export async function createSortingReport(payload: {
  name: string;
  details: string;
  branch_ids: number[];
}): Promise<void> {
  await api.post("/v1/reports/create-sorting-report", payload);
}

/** DELETE /v1/reports/sorting-reports/{sortingReport}. */
export async function deleteSortingReport(id: number | string): Promise<void> {
  await api.delete(`/v1/reports/sorting-reports/${id}`);
}

/** Helper for building a filter's query-string value before it's sent. */
export function isRequiredFieldMissing(
  field: BespokeFilterField,
  values: Record<string, string>
): boolean {
  return !!field.required && !values[field.key];
}
