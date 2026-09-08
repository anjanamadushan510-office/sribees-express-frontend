"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, RotateCcw, Eye } from "lucide-react";
import {
  useMyInvoices,
  useReceivableOrders,
  useReceivedOrders,
} from "@/lib/hooks/use-finances";
import type { ClientFinanceOrderRow, ClientInvoiceRow } from "@/types/finance";
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

const invoiceColumns: Column<ClientInvoiceRow>[] = [
  { header: "Invoice #", cell: (r) => <span className="font-medium">{r.invoice_no}</span> },
  { header: "Date", cell: (r) => formatDate(r.invoice_date) },
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
    header: "Payable",
    className: "text-right",
    cell: (r) => formatCurrency(r.final_payable),
  },
  { header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
  {
    header: "",
    cell: (r) => (
      <Button asChild variant="ghost" size="sm">
        <Link href={`/finances/${r.id}`}>
          <Eye className="size-4" />
          View
        </Link>
      </Button>
    ),
  },
];

const orderColumns: Column<ClientFinanceOrderRow>[] = [
  { header: "Waybill", cell: (r) => <span className="font-medium">{r.waybill_id}</span> },
  { header: "Customer", cell: (r) => r.customer_name },
  {
    header: "Destination",
    cell: (r) => (
      <div className="text-sm">
        {r.city ?? "—"}
        <span className="block text-xs text-muted-foreground">{r.district ?? ""}</span>
      </div>
    ),
  },
  { header: "COD", className: "text-right", cell: (r) => formatCurrency(r.cod) },
  { header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
  { header: "Date", cell: (r) => formatDate(r.order_date) },
];

export default function FinancesPage() {
  return (
    <>
      <PageHeader
        title="Finances"
        description="Invoices, receivable orders, and settled payments."
      />
      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices">My Invoices</TabsTrigger>
          <TabsTrigger value="receivable">Receivable Orders</TabsTrigger>
          <TabsTrigger value="received">Received Orders</TabsTrigger>
        </TabsList>
        <TabsContent value="invoices">
          <InvoicesTab />
        </TabsContent>
        <TabsContent value="receivable">
          <OrdersTab kind="receivable" />
        </TabsContent>
        <TabsContent value="received">
          <OrdersTab kind="received" />
        </TabsContent>
      </Tabs>
    </>
  );
}

function InvoicesTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const { data, isFetching, isError } = useMyInvoices({
    page,
    perPage: PER_PAGE,
    invoice_no: appliedSearch || undefined,
  });

  return (
    <>
      <Card className="mb-4 mt-4">
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Invoice #</label>
            <Input
              placeholder="Search invoice number…"
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
            Couldn&apos;t load invoices right now. Check your connection and try again.
          </CardContent>
        </Card>
      ) : (
        <>
          <DataTable
            columns={invoiceColumns}
            rows={data?.items}
            isLoading={isFetching && !data}
            rowKey={(r) => r.id}
            emptyMessage="No invoices yet."
          />
          <Pagination
            pagination={data?.pagination}
            onPageChange={setPage}
            isLoading={isFetching}
          />
        </>
      )}
    </>
  );
}

function OrdersTab({ kind }: { kind: "receivable" | "received" }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const receivable = useReceivableOrders({
    page,
    perPage: PER_PAGE,
    waybill_id: kind === "receivable" ? appliedSearch || undefined : undefined,
  });
  const received = useReceivedOrders({
    page,
    perPage: PER_PAGE,
    waybill_id: kind === "received" ? appliedSearch || undefined : undefined,
  });
  const { data, isFetching, isError } = kind === "receivable" ? receivable : received;

  return (
    <>
      <Card className="mb-4 mt-4">
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-end">
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
            Couldn&apos;t load orders right now. Check your connection and try again.
          </CardContent>
        </Card>
      ) : (
        <>
          <DataTable
            columns={orderColumns}
            rows={data?.items}
            isLoading={isFetching && !data}
            rowKey={(r) => r.id}
            emptyMessage="No orders here yet."
          />
          <Pagination
            pagination={data?.pagination}
            onPageChange={setPage}
            isLoading={isFetching}
          />
        </>
      )}
    </>
  );
}
