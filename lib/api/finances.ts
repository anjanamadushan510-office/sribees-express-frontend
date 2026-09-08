import { api, pickKey, unwrap, unwrapPaginated } from "@/lib/api/client";
import type { ApiResponse, Paginated } from "@/types/api";
import type {
  ClientFinanceOrderRow,
  ClientFinanceOrdersListParams,
  ClientInvoiceListParams,
  ClientInvoiceOrderRow,
  ClientInvoiceOrdersListParams,
  ClientInvoiceRow,
  ClientInvoiceSetoffListParams,
  ClientInvoiceSetoffRow,
  PrintInvoiceResult,
} from "@/types/finance";

/** GET /api/v1/client-finances/my-invoice/list — the signed-in client's invoices. */
export async function listMyInvoices(
  params: ClientInvoiceListParams
): Promise<Paginated<ClientInvoiceRow>> {
  const res = await api.get<ApiResponse<ClientInvoiceRow[]>>(
    "/v1/client-finances/my-invoice/list",
    { params: clean(params) }
  );
  return unwrapPaginated<ClientInvoiceRow>(res);
}

/** GET /api/v1/client-finances/receivable-orders/list — orders not yet invoiced. */
export async function listReceivableOrders(
  params: ClientFinanceOrdersListParams
): Promise<Paginated<ClientFinanceOrderRow>> {
  const res = await api.get<ApiResponse<ClientFinanceOrderRow[]>>(
    "/v1/client-finances/receivable-orders/list",
    { params: clean(params) }
  );
  return unwrapPaginated<ClientFinanceOrderRow>(res);
}

/** GET /api/v1/client-finances/received-orders/list — orders already invoiced/paid. */
export async function listReceivedOrders(
  params: ClientFinanceOrdersListParams
): Promise<Paginated<ClientFinanceOrderRow>> {
  const res = await api.get<ApiResponse<ClientFinanceOrderRow[]>>(
    "/v1/client-finances/received-orders/list",
    { params: clean(params) }
  );
  return unwrapPaginated<ClientFinanceOrderRow>(res);
}

/**
 * GET /api/v1/client-finances/invoices-view/list/{clientInvoice} — the orders
 * that make up one invoice (AllInvoiceOrdersViewList, standard makePaginatedResponse).
 */
export async function listInvoiceOrders(
  invoiceId: number | string,
  params: ClientInvoiceOrdersListParams
): Promise<Paginated<ClientInvoiceOrderRow>> {
  const res = await api.get<ApiResponse<ClientInvoiceOrderRow[]>>(
    `/v1/client-finances/invoices-view/list/${invoiceId}`,
    { params: clean(params) }
  );
  return unwrapPaginated<ClientInvoiceOrderRow>(res);
}

/**
 * GET /api/v1/client-finances/invoices-view-setoff/list/{clientInvoice} — other
 * invoices this one has been set off against (only meaningful when the client
 * has setoff enabled; otherwise returns an empty list).
 */
export async function listInvoiceSetoffs(
  invoiceId: number | string,
  params: ClientInvoiceSetoffListParams
): Promise<Paginated<ClientInvoiceSetoffRow>> {
  const res = await api.get<ApiResponse<ClientInvoiceSetoffRow[]>>(
    `/v1/client-finances/invoices-view-setoff/list/${invoiceId}`,
    { params: clean(params) }
  );
  return unwrapPaginated<ClientInvoiceSetoffRow>(res);
}

/**
 * GET /api/v1/client-finances/print-invoices/{clientInvoice} — full printable
 * invoice breakdown (PrintInvoiceAction). Response goes through the backend's
 * named-key-list envelope reshape, so every top-level section is read via
 * `pickKey()`.
 */
export async function getPrintInvoice(
  invoiceId: number | string
): Promise<PrintInvoiceResult> {
  const res = await api.get<ApiResponse<unknown>>(
    `/v1/client-finances/print-invoices/${invoiceId}`
  );
  const data = unwrap(res);
  return {
    client_details: pickKey(data, "client_details") ?? [],
    rate_data: pickKey(data, "rate_data") ?? {
      zones: [],
      total_order_count: 0,
      total_delivery_charge: 0,
      total_cod_collected: 0,
      total_commission: 0,
      total_charges: 0,
    },
    tax_details: pickKey(data, "tax_details") ?? {},
    customer_account_statement: pickKey(data, "customer_account_statement") ?? {
      total_cod_collected: "0.00",
      total_charges: "0.00",
      tax_details: [],
      total_tax: "0.00",
      total_setoff_amount: "0.00",
      net_payable: "0.00",
    },
    invoice_details: pickKey(data, "invoice_details") ?? [],
    setoff_invoice_details: pickKey(data, "setoff_invoice_details") ?? [],
  };
}

function clean<T extends object>(params: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    out[k] = v;
  }
  return out;
}
