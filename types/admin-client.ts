/** A row from GET /api/v1/clients/list (ClientListAction). */
export interface AdminClientRow {
  client_id: number;
  client_number: string;
  client_name: string;
  address: string | null;
  pickup_branch: string | null;
  pick_address: string | null;
  email: string | null;
  financial_email: string | null;
  account_holder_name: string | null;
  bank_account_number: string | null;
  branch_id: number | null;
  bank_name: string | null;
  branch_name: string | null;
  owner_nic: string | null;
  advisor_name: string | null;
  status: "new" | "active" | "deactivated" | string | null;
  remark: string | null;
  nearest_city: string | null;
  act_or_dct_by_id: number | null;
  act_or_dct_by_name: string | null;
  act_or_dct_at: string | null;
  owner_name: string | null;
  business_reg_no: string | null;
  payment_terms: string | null;
  registration_no: string | null;
  registration_date: string | null;
}

export interface AdminClientListParams {
  page?: number;
  perPage?: number;
  orderBy?:
    | "client_name"
    | "client_number"
    | "email"
    | "status"
    | "pickup_branch"
    | "created_at";
  orderByDirection?: "asc" | "desc";
  status?: string[];
  client_id?: number;
  client_no?: string;
  client_name?: string;
  email?: string;
}

/** GET /v1/clients/information/{client} → data.info (training/registration metadata). */
export interface ClientInfoMeta {
  id: number;
  register_date: string | null;
  activate_date: string | null;
  activated_by: string | null;
  rate_card_updated_by: string | null;
  last_updated_date: string | null;
  last_update_by: string | null;
  trained_by_id: number | null;
  trained_at: string | null;
}

/** Payload for PUT /v1/clients/information/update/{client} (UpdateClientInformationDTO). */
export interface UpdateTrainingPayload {
  trained_by_id: number;
  trained_at: string;
}

/** GET /v1/clients/client-information/{client} → data.client (full model + extras). */
export interface ClientInformationDetail {
  id: number;
  way_bill_auto_generate: "Auto" | "Manual" | null;
  nearest_city: number | null;
  pickup_branch: string | null;
  is_multiple_business_active: boolean | number | null;
  business_type: Record<string, string>;
  identity_document_front: string | null;
  identity_document_back: string | null;
  registration_no?: string | null;
  registration_date?: string | null;
  [key: string]: unknown;
}

/** Payload for PUT /v1/clients/client-information/update/{client} (UpdateInformationDTO). */
export interface UpdateWaybillSettingsPayload {
  way_bill_auto_generate: "Auto" | "Manual";
  nearest_city: number;
  pickup_branch: string;
  is_multiple_business_active: boolean;
}

/** Payload for PUT /v1/clients/client-registered-details/update/{client}. */
export interface UpdateRegisteredDetailsPayload {
  registration_no?: string;
  registration_date?: string;
}

/** One row of GET /v1/clients/finance/{client} → data.rate_card. */
export interface ZoneRateCard {
  id: number;
  z_name: string;
  first_kg: number | string;
  after_kg: number | string;
  delivery_weight_margin: number | string;
  return_first_kg: number | string;
  return_after_kg: number | string;
}

export interface ClientFinance {
  rate_card: ZoneRateCard[];
  city_required_option: boolean | number | null;
  client_invoice_period: {
    client_inv_period: number | null;
    invoice_type: string | null;
    next_invoice_date: string | null;
    last_invoice_date: string | null;
    weekday: string | null;
    day_of_month: string | null;
  };
  other: {
    cancel_days: number | null;
    commission: number | null;
    max_account: number | null;
    is_setoff_active: boolean | number | null;
  };
}

/** Payload for PUT /v1/clients/finance/update/{client} (UpdateFinanceDTO). */
export interface UpdateFinancePayload {
  zones: {
    id: number;
    first_kg: number;
    after_kg: number;
    return_first_kg: number;
    return_after_kg: number;
    delivery_weight_margin: number;
  }[];
  is_city_active: boolean;
  client_inv_period: number;
  invoice_type: "Days" | "Week" | "Month";
  next_invoice_date: string;
  cancel_days: number;
  commission: number;
  max_account: number;
  is_setoff_active: boolean;
  weekday?: string;
  month_field?: string;
  update_next_date?: boolean;
}

/** GET /v1/clients/tax/{client} → data.tax_info. */
export interface ClientTaxInfo {
  is_tax_active: boolean | number | null;
  tax_type: number[] | null;
  tax_number: number | string | null;
  tax_updated_date: string | null;
}

/** Payload for PUT /v1/clients/tax/update/{client} (UpdateTaxDTO). */
export interface UpdateTaxPayload {
  is_tax_active: boolean;
  tax_type: number[];
  tax_number: number;
}

/** GET /v1/clients/marketing/{client} → data.marketingInfo. */
export interface ClientMarketingInfo {
  commission_entitled_id: number | null;
  introduced_by_id: number | null;
}

/** Payload for PUT /v1/clients/marketing/update/{client} (UpdateMarketingDTO). */
export interface UpdateMarketingPayload {
  commission_entitled_id: number;
  introduced_by_id: number;
  waybill_amount?: number;
  barcode_amount?: number;
}

/** GET /v1/clients/api/{client} → data.info. */
export interface ClientApiInfo {
  api_token: string | null;
  token_generated_by: string | null;
  token_generated_at: string | null;
  is_webhook_active: boolean | number | null;
}
