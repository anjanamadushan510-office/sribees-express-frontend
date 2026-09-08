import { api, pickKey, unwrap, unwrapPaginated } from "@/lib/api/client";
import type { ApiResponse, Paginated } from "@/types/api";
import type {
  AdminClientListParams,
  AdminClientRow,
  ClientApiInfo,
  ClientFinance,
  ClientInfoMeta,
  ClientInformationDetail,
  ClientMarketingInfo,
  ClientTaxInfo,
  UpdateFinancePayload,
  UpdateMarketingPayload,
  UpdateRegisteredDetailsPayload,
  UpdateTaxPayload,
  UpdateTrainingPayload,
  UpdateWaybillSettingsPayload,
} from "@/types/admin-client";

/** GET /api/v1/clients/list — paginated client directory. */
export async function listAdminClients(
  params: AdminClientListParams
): Promise<Paginated<AdminClientRow>> {
  const res = await api.get<ApiResponse<AdminClientRow[]>>("/v1/clients/list", {
    params: clean(params),
  });
  return unwrapPaginated<AdminClientRow>(res);
}

/** PUT /api/v1/clients/status/update/{client} (ToggleClientStatusDTO). */
export async function toggleClientStatus(
  id: number | string,
  isActive: boolean,
  remark?: string
): Promise<void> {
  await api.put(`/v1/clients/status/update/${id}`, {
    is_active: isActive,
    remark: remark || undefined,
  });
}

/** GET /api/v1/clients/information/{client} — training/registration metadata. */
export async function getClientInfoMeta(id: number | string): Promise<ClientInfoMeta> {
  const res = await api.get<ApiResponse<unknown>>(`/v1/clients/information/${id}`);
  const info = pickKey<ClientInfoMeta>(unwrap(res), "info");
  if (!info) throw new Error("Client not found");
  return info;
}

/** PUT /api/v1/clients/information/update/{client} (UpdateClientInformationDTO). */
export async function updateTraining(
  id: number | string,
  payload: UpdateTrainingPayload
): Promise<void> {
  await api.put(`/v1/clients/information/update/${id}`, payload);
}

/** GET /api/v1/clients/client-information/{client} — full client + waybill/branch settings. */
export async function getClientInformation(
  id: number | string
): Promise<ClientInformationDetail> {
  const res = await api.get<ApiResponse<unknown>>(`/v1/clients/client-information/${id}`);
  const client = pickKey<ClientInformationDetail>(unwrap(res), "client");
  if (!client) throw new Error("Client not found");
  return client;
}

/** PUT /api/v1/clients/client-information/update/{client} (UpdateInformationDTO). */
export async function updateWaybillSettings(
  id: number | string,
  payload: UpdateWaybillSettingsPayload
): Promise<void> {
  await api.put(`/v1/clients/client-information/update/${id}`, payload);
}

/** PUT /api/v1/clients/client-registered-details/update/{client}. */
export async function updateRegisteredDetails(
  id: number | string,
  payload: UpdateRegisteredDetailsPayload
): Promise<void> {
  await api.put(`/v1/clients/client-registered-details/update/${id}`, payload);
}

/** GET /api/v1/clients/finance/{client}. */
export async function getClientFinance(id: number | string): Promise<ClientFinance> {
  const res = await api.get<ApiResponse<unknown>>(`/v1/clients/finance/${id}`);
  const data = unwrap(res);
  return {
    rate_card: pickKey(data, "rate_card") ?? [],
    city_required_option: pickKey(data, "city_required_option") ?? null,
    client_invoice_period: pickKey(data, "client_invoice_period") ?? {
      client_inv_period: null,
      invoice_type: null,
      next_invoice_date: null,
      last_invoice_date: null,
      weekday: null,
      day_of_month: null,
    },
    other: pickKey(data, "other") ?? {
      cancel_days: null,
      commission: null,
      max_account: null,
      is_setoff_active: null,
    },
  };
}

/** PUT /api/v1/clients/finance/update/{client} (UpdateFinanceDTO). */
export async function updateClientFinance(
  id: number | string,
  payload: UpdateFinancePayload
): Promise<void> {
  await api.put(`/v1/clients/finance/update/${id}`, payload);
}

/** GET /api/v1/clients/tax/{client}. */
export async function getClientTax(id: number | string): Promise<ClientTaxInfo> {
  const res = await api.get<ApiResponse<unknown>>(`/v1/clients/tax/${id}`);
  const tax = pickKey<ClientTaxInfo>(unwrap(res), "tax_info");
  if (!tax) throw new Error("Client not found");
  return tax;
}

/** PUT /api/v1/clients/tax/update/{client} (UpdateTaxDTO). */
export async function updateClientTax(
  id: number | string,
  payload: UpdateTaxPayload
): Promise<void> {
  await api.put(`/v1/clients/tax/update/${id}`, payload);
}

/** GET /api/v1/clients/marketing/{client}. */
export async function getClientMarketing(id: number | string): Promise<ClientMarketingInfo> {
  const res = await api.get<ApiResponse<unknown>>(`/v1/clients/marketing/${id}`);
  const info = pickKey<ClientMarketingInfo>(unwrap(res), "marketingInfo");
  return info ?? { commission_entitled_id: null, introduced_by_id: null };
}

/** PUT /api/v1/clients/marketing/update/{client} (UpdateMarketingDTO). */
export async function updateClientMarketing(
  id: number | string,
  payload: UpdateMarketingPayload
): Promise<void> {
  await api.put(`/v1/clients/marketing/update/${id}`, payload);
}

/** GET /api/v1/clients/api/{client}. */
export async function getClientApiInfo(id: number | string): Promise<ClientApiInfo> {
  const res = await api.get<ApiResponse<unknown>>(`/v1/clients/api/${id}`);
  const info = pickKey<ClientApiInfo>(unwrap(res), "info");
  if (!info) throw new Error("Client not found");
  return info;
}

/** POST /api/v1/clients/api/generate-token/{client}. */
export async function generateClientApiToken(id: number | string): Promise<void> {
  await api.post(`/v1/clients/api/generate-token/${id}`);
}

/** PUT /api/v1/clients/api/webhook/status/update/{client} (ToggleStatusDTO). */
export async function toggleClientWebhook(
  id: number | string,
  isActive: boolean
): Promise<void> {
  await api.put(`/v1/clients/api/webhook/status/update/${id}`, { is_active: isActive });
}

function clean(params: AdminClientListParams): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out;
}
