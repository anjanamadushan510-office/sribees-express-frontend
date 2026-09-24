"use client";

import { useState } from "react";
import { Search, RotateCcw } from "lucide-react";
import {
  useHOClearance,
  useHOOrders,
  useReversalHistory,
} from "@/lib/hooks/use-admin-ho-operations";
import type {
  HOClearanceRow,
  HOOrderRow,
  ReversalHistoryRow,
} from "@/types/admin-ho-operations";
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

export default function AdminHOOperationsPage() {
  return (
    <>
      <PageHeader
        title="Head Office Operations"
        description="HO-wide order visibility, clearance, and status-reversal history."
      />
      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="clearance">Clearance</TabsTrigger>
          <TabsTrigger value="reversals">Reversal History</TabsTrigger>
        </TabsList>
        <TabsContent value="orders">
          <OrdersTab />
        </TabsContent>
        <TabsContent value="clearance">
          <ClearanceTab />
        </TabsContent>
        <TabsContent value="reversals">
          <ReversalsTab />
        </TabsContent>
      </Tabs>
    </>
  );
}

function SearchBar({
  value,
  onChange,
  onSearch,
  onReset,
  label = "Waybill",
}: {
  value: string;
  onChange: (v: string) => void;
  onSearch: () => void;
  onReset: () => void;
  label?: string;
}) {
  return (
    <Card className="mb-4 mt-4">
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1">
          <label className="text-xs font-medium text-muted-foreground">{label}</label>
          <Input
            placeholder={`Search ${label.toLowerCase()}…`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={onSearch}>
            <Search className="size-4" />
            Search
          </Button>
          <Button variant="outline" onClick={onReset}>
            <RotateCcw className="size-4" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function OrdersTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState("");

  const { data, isFetching, isError } = useHOOrders({
    page,
    perPage: PER_PAGE,
    waybill_id: applied || undefined,
  });

  const columns: Column<HOOrderRow>[] = [
    { header: "Waybill", cell: (r) => <span className="font-medium">{r.waybill_id}</span> },
    { header: "Client", cell: (r) => r.client_name ?? "—" },
    { header: "Customer", cell: (r) => r.customer_name },
    {
      header: "Branch",
      cell: (r) => (
        <div className="text-sm">
          {r.branch_name ?? "—"}
          {r.temporary_branch && (
            <span className="block text-xs text-muted-foreground">
              → {r.temporary_branch}
            </span>
          )}
        </div>
      ),
    },
    { header: "COD", className: "text-right", cell: (r) => formatCurrency(r.cod) },
    { header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
    { header: "Date", cell: (r) => formatDate(r.order_date) },
  ];

  return (
    <>
      <SearchBar
        value={search}
        onChange={setSearch}
        onSearch={() => {
          setApplied(search.trim());
          setPage(1);
        }}
        onReset={() => {
          setSearch("");
          setApplied("");
          setPage(1);
        }}
      />
      {isError ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Couldn&apos;t load orders right now. Check your connection and try again.
          </CardContent>
        </Card>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data?.items}
            isLoading={isFetching && !data}
            rowKey={(r) => r.id}
            emptyMessage="No orders found."
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

function ClearanceTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState("");

  const { data, isFetching, isError } = useHOClearance({
    page,
    perPage: PER_PAGE,
    waybill_id: applied || undefined,
  });

  const columns: Column<HOClearanceRow>[] = [
    { header: "Waybill", cell: (r) => <span className="font-medium">{r.waybill_id}</span> },
    { header: "Client", cell: (r) => r.client_name ?? "—" },
    { header: "Customer", cell: (r) => r.customer_name },
    { header: "Original branch", cell: (r) => r.original_branch ?? "—" },
    { header: "Rider", cell: (r) => r.rider ?? "—" },
    { header: "COD", className: "text-right", cell: (r) => formatCurrency(r.cod) },
    { header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
    { header: "Date", cell: (r) => formatDate(r.order_date) },
  ];

  return (
    <>
      <SearchBar
        value={search}
        onChange={setSearch}
        onSearch={() => {
          setApplied(search.trim());
          setPage(1);
        }}
        onReset={() => {
          setSearch("");
          setApplied("");
          setPage(1);
        }}
      />
      {isError ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Couldn&apos;t load clearance data right now. Check your connection and try
            again.
          </CardContent>
        </Card>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data?.items}
            isLoading={isFetching && !data}
            rowKey={(r) => r.id}
            emptyMessage="No orders pending clearance."
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

function ReversalsTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState("");

  const { data, isFetching, isError } = useReversalHistory({
    page,
    perPage: PER_PAGE,
    waybill_id: applied || undefined,
  });

  const columns: Column<ReversalHistoryRow>[] = [
    { header: "Waybill", cell: (r) => <span className="font-medium">{r.waybill_id}</span> },
    {
      header: "Reversal",
      cell: (r) => (
        <span>
          {r.from_status_name ?? "—"} → {r.to_status_name ?? "—"}
        </span>
      ),
    },
    { header: "Reversed by", cell: (r) => r.reversed_by ?? "—" },
    { header: "Branch", cell: (r) => r.data?.branch_name ?? "—" },
    { header: "Rider", cell: (r) => r.data?.rider_name ?? "—" },
    { header: "Comment", cell: (r) => r.comment ?? "—" },
    { header: "Date", cell: (r) => formatDate(r.order_date) },
  ];

  return (
    <>
      <SearchBar
        value={search}
        onChange={setSearch}
        onSearch={() => {
          setApplied(search.trim());
          setPage(1);
        }}
        onReset={() => {
          setSearch("");
          setApplied("");
          setPage(1);
        }}
      />
      {isError ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Couldn&apos;t load reversal history right now. Check your connection and try
            again.
          </CardContent>
        </Card>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data?.items}
            isLoading={isFetching && !data}
            rowKey={(r) => r.id}
            emptyMessage="No status reversals recorded."
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
