/** A row from GET /v1/client-finances/my-invoice/list (MyInvoiceListAction). */
export interface ClientInvoiceRow {
  id: number;
  invoice_date: string;
  invoice_no: string;
  commission: number | string;
  total_cod: number | string;
  total_collected_cod: number | string;
  delivery_charge: number | string;
  total_commission: number | string;
  final_invoice_value: number | string;
  setoff: number | string | null;
  final_payable: number | string;
  status: string | null;
}

export interface ClientInvoiceListParams {
  page?: number;
  perPage?: number;
  orderBy?: string;
  orderByDirection?: "asc" | "desc";
  dateRange?: string;
  invoice_no?: string;
}

/**
 * A row shared by both `receivable-orders/list` and `received-orders/list`
 * (ReceivableOrdersListAction / ReceivedOrdersListAction — identical shape).
 */
export interface ClientFinanceOrderRow {
  id: number;
  order_date: string;
  waybill_id: string;
  customer_name: string;
  address: string;
  phone_no: string;
  cod: number | string;
  district: string | null;
  city: string | null;
  status_updated_date: string | null;
  status: string | null;
  delivery_progress?: number;
}

export interface ClientFinanceOrdersListParams {
  page?: number;
  perPage?: number;
  orderBy?: string;
  orderByDirection?: "asc" | "desc";
  orderDate?: string;
  waybill_id?: string;
  customer_name?: string;
  address?: string;
  phone_no?: string;
}

/**
 * A row from GET /v1/client-finances/invoices-view/list/{clientInvoice}
 * (AllInvoiceOrdersViewList) — the orders that make up one invoice.
 */
export interface ClientInvoiceOrderRow {
  id: number;
  order_date: string;
  waybill_id: string;
  order_no: string | null;
  invoice_no: string | null;
  vat_percentage: number | string | null;
  commission: number | string | null;
  cod: number | string | null;
  collected_cod: number | string | null;
  delivery_charge: number | string | null;
  total_vat: number | string | null;
  weight: number | string | null;
  status: string | null;
  total_commission: number | string;
  payable: number | string;
}

export interface ClientInvoiceOrdersListParams {
  page?: number;
  perPage?: number;
  orderBy?: "id" | "order_date" | "waybill_id";
  orderByDirection?: "asc" | "desc";
  waybill_id?: string;
  order_no?: string;
  invoice_no?: string;
}

/**
 * A row from GET /v1/client-finances/invoices-view-setoff/list/{clientInvoice}
 * (AllInvoiceSetoffViewList) — the other invoices this one has been set off
 * against. Raw DB::select() output, values come back as numeric strings.
 */
export interface ClientInvoiceSetoffRow {
  id: number;
  invoice_date: string;
  invoice_no: string;
  client_id: string; // clients.client_no, despite the name
  client: string;
  total_commission: number | string;
  total_cod: number | string;
  total_collected_cod: number | string;
  total_delivery_charge: number | string;
  total_payable_without_tax: number | string;
  total_tax: number | string;
  final_invoice_value: number | string;
}

export interface ClientInvoiceSetoffListParams {
  page?: number;
  perPage?: number;
  invoice_no?: string;
  client?: string;
  client_no?: string;
}

/** One row of GET /v1/client-finances/print-invoices/{clientInvoice} → data.client_details. */
export interface PrintInvoiceClientDetail {
  name: string;
  address: string;
  tax_number: string | null;
  inv_no: string;
  created_at: string;
}

export interface PrintInvoiceZone {
  zone_name: string;
  order_count: number;
  total_cod: number | string;
  total_cod_collected: number | string;
  delivery_charge: number | string;
  commission: number | string;
  total_charges?: number | string;
  commission_percentage?: number | string;
}

export interface PrintInvoiceRateData {
  zones: PrintInvoiceZone[];
  total_order_count: number;
  total_delivery_charge: number | string;
  total_cod_collected: number | string;
  total_commission: number | string;
  total_charges: number | string;
}

export interface PrintInvoiceTaxDetail {
  tax_name: string | null;
  tax_rate: number | string | null;
  tax_amount: number | string | null;
}

/**
 * `PrintInvoiceAction::getTaxDetails` builds a numeric-indexed PHP array of
 * `PrintInvoiceTaxDetail` lines, then appends a `total_tax` STRING key onto
 * the same array — which makes PHP's `json_encode` serialize the whole thing
 * as a JSON *object* (mixed int/string keys are never a "list"), not an
 * array. Numeric-string keys ("0", "1", ...) hold the tax lines; the
 * `total_tax` key holds the raw numeric total. Read defensively — filter
 * `Object.entries()` for numeric keys to get the lines.
 */
export type PrintInvoiceTopLevelTaxDetails = Record<string, unknown>;

export interface PrintInvoiceAccountStatement {
  total_cod_collected: string;
  total_charges: string;
  tax_details: PrintInvoiceTaxDetail[];
  total_tax: string;
  total_setoff_amount: string;
  net_payable: string;
}

export interface PrintInvoiceOrderDetail {
  waybill_id: string;
  order_no: string | null;
  cod: number | string;
  collected_cod: number | string;
  delivery_charge: number | string;
  city_name: string;
  total_commission: number | string;
  payable: number | string;
  weight: number | string | null;
  status: string | null;
}

export interface PrintInvoiceSetoffDetail {
  id: number;
  cod: string;
  collected_cod: string;
  d_charge: string;
  tax: string;
  commission: string;
  payable: string;
  status_name: string | null;
}

/** Full result of GET /v1/client-finances/print-invoices/{clientInvoice} (PrintInvoiceAction). */
export interface PrintInvoiceResult {
  client_details: PrintInvoiceClientDetail[];
  rate_data: PrintInvoiceRateData;
  tax_details: PrintInvoiceTopLevelTaxDetails;
  customer_account_statement: PrintInvoiceAccountStatement;
  invoice_details: PrintInvoiceOrderDetail[];
  setoff_invoice_details: PrintInvoiceSetoffDetail[];
}
