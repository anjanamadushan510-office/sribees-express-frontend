"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Printer, RotateCcw, Search } from "lucide-react";
import { useInvoiceOrders, useInvoiceSetoffs } from "@/lib/hooks/use-finances";
import type { ClientInvoiceOrderRow, ClientInvoiceSetoffRow } from "@/types/finance";
import { formatCurrency, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PER_PAGE = 15;

const orderColumns: Column<ClientInvoiceOrderRow>[] = [
  { header: "Waybill", cell: (r) => <span className="font-medium">{r.waybill_id}</span> },
  { header: "Order #", cell: (r) => r.order_no ?? "—" },
  { header: "Date", cell: (r) => formatDate(r.order_date) },
  { header: "COD", className: "text-right", cell: (r) => formatCurrency(r.cod) },
  {
    header: "Collected COD",
    className: "text-right",
    cell: (r) => formatCurrency(r.collected_cod),
  },
  {
    header: "Delivery charge",
    className: "text-right",
    cell: (r) => formatCurrency(r.delivery_charge),
  },
  {
    header: "Commission",
    className: "text-right",
    cell: (r) => formatCurrency(r.total_commission),
  },
  { header: "Payable", className: "text-right", cell: (r) => formatCurrency(r.payable) },
  { header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
];

const setoffColumns: Column<ClientInvoiceSetoffRow>[] = [
  { header: "Invoice #", cell: (r) => <span className="font-medium">{r.invoice_no}</span> },
  { header: "Date", cell: (r) => formatDate(r.invoice_date) },
  { header: "Client", cell: (r) => r.client },
  { header: "Total COD", className: "text-right", cell: (r) => formatCurrency(r.total_cod) },
  {
    header: "Collected COD",
    className: "text-right",
    cell: (r) => formatCurrency(r.total_collected_cod),
  },
  {
    header: "Commission",
    className: "text-right",
    cell: (r) => formatCurrency(r.total_commission),
  },
  {
    header: "Invoice value",
    className: "text-right",
    cell: (r) => formatCurrency(r.final_invoice_value),
  },
];

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2">
            <Link href="/finances">
              <ArrowLeft className="size-4" />
              Back to finances
            </Link>
          </Button>
          <PageHeader
            title={`Invoice #${id}`}
            description="Orders included in this invoice, and any setoff invoices."
          />
        </div>
        <Button asChild variant="outline">
          <Link href={`/print/invoice/${id}`} target="_blank">
            <Printer className="size-4" />
            Print invoice
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="setoff">Setoff invoices</TabsTrigger>
        </TabsList>
        <TabsContent value="orders">
          <OrdersTab invoiceId={id} />
        </TabsContent>
        <TabsContent value="setoff">
          <SetoffTab invoiceId={id} />
        </TabsContent>
      </Tabs>
    </>
  );
}

function OrdersTab({ invoiceId }: { invoiceId: string }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const { data, isFetching, isError } = useInvoiceOrders(invoiceId, {
    page,
    perPage: PER_PAGE,
    waybill_id: appliedSearch || undefined,
  });

  return (
    <>
      <Card className="mb-4 mt-4">
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Waybill</label>
            <Input
              placeholder="Search waybill…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setAppliedSearch(search.trim());
                  setPage(1);
                }
              }}
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setAppliedSearch(search.trim());
                setPage(1);
              }}
            >
              <Search className="size-4" />
              Search
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setAppliedSearch("");
                setPage(1);
              }}
            >
              <RotateCcw className="size-4" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {isError ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Couldn&apos;t load this invoice&apos;s orders right now. Check your connection and
            try again.
          </CardContent>
        </Card>
      ) : (
        <>
          <DataTable
            columns={orderColumns}
            rows={data?.items}
            isLoading={isFetching && !data}
            rowKey={(r) => r.id}
            emptyMessage="No orders found for this invoice."
          />
          <Pagination pagination={data?.pagination} onPageChange={setPage} isLoading={isFetching} />
        </>
      )}
    </>
  );
}

function SetoffTab({ invoiceId }: { invoiceId: string }) {
  const [page, setPage] = useState(1);

  const { data, isFetching, isError } = useInvoiceSetoffs(invoiceId, {
    page,
    perPage: PER_PAGE,
  });

  return (
    <div className="mt-4">
      {isError ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Couldn&apos;t load setoff invoices right now. Check your connection and try again.
          </CardContent>
        </Card>
      ) : (
        <>
          <DataTable
            columns={setoffColumns}
            rows={data?.items}
            isLoading={isFetching && !data}
            rowKey={(r) => r.id}
            emptyMessage="No setoff invoices — this invoice hasn't been set off against another one."
          />
          <Pagination pagination={data?.pagination} onPageChange={setPage} isLoading={isFetching} />
        </>
      )}
    </div>
  );
}
