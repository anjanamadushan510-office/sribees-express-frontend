import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  getPrintInvoice,
  listInvoiceOrders,
  listInvoiceSetoffs,
  listMyInvoices,
  listReceivableOrders,
  listReceivedOrders,
} from "@/lib/api/finances";
import type {
  ClientFinanceOrdersListParams,
  ClientInvoiceListParams,
  ClientInvoiceOrdersListParams,
  ClientInvoiceSetoffListParams,
} from "@/types/finance";

export function useMyInvoices(params: ClientInvoiceListParams) {
  return useQuery({
    queryKey: ["my-invoices", params],
    queryFn: () => listMyInvoices(params),
    placeholderData: keepPreviousData,
  });
}

export function useReceivableOrders(params: ClientFinanceOrdersListParams) {
  return useQuery({
    queryKey: ["receivable-orders", params],
    queryFn: () => listReceivableOrders(params),
    placeholderData: keepPreviousData,
  });
}

export function useReceivedOrders(params: ClientFinanceOrdersListParams) {
  return useQuery({
    queryKey: ["received-orders", params],
    queryFn: () => listReceivedOrders(params),
    placeholderData: keepPreviousData,
  });
}

export function useInvoiceOrders(
  invoiceId: number | string,
  params: ClientInvoiceOrdersListParams
) {
  return useQuery({
    queryKey: ["invoice-orders", String(invoiceId), params],
    queryFn: () => listInvoiceOrders(invoiceId, params),
    enabled: !!invoiceId,
    placeholderData: keepPreviousData,
  });
}

export function useInvoiceSetoffs(
  invoiceId: number | string,
  params: ClientInvoiceSetoffListParams
) {
  return useQuery({
    queryKey: ["invoice-setoffs", String(invoiceId), params],
    queryFn: () => listInvoiceSetoffs(invoiceId, params),
    enabled: !!invoiceId,
    placeholderData: keepPreviousData,
  });
}

export function usePrintInvoice(invoiceId: number | string) {
  return useQuery({
    queryKey: ["print-invoice", String(invoiceId)],
    queryFn: () => getPrintInvoice(invoiceId),
    enabled: !!invoiceId,
  });
}
