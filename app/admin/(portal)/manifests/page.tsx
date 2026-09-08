"use client";

import { useState } from "react";
import { Search, RotateCcw } from "lucide-react";
import {
  useBranchManifest,
  useDDManifest,
  useReturnClientManifest,
  useReturnHOManifest,
  useRiderManifest,
} from "@/lib/hooks/use-admin-manifests";
import type {
  ClearedManifestRow,
  ReturnClientManifestRow,
  RiderManifestRow,
} from "@/types/admin-manifest";
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

export default function AdminManifestsPage() {
  return (
    <>
      <PageHeader
        title="Manifests"
        description="Order manifests by branch, rider, and return workflow."
      />
      <Tabs defaultValue="branch">
        <TabsList>
          <TabsTrigger value="branch">Branch</TabsTrigger>
          <TabsTrigger value="rider">Rider</TabsTrigger>
          <TabsTrigger value="return-ho">Return to HO</TabsTrigger>
          <TabsTrigger value="dd">Different Destination</TabsTrigger>
          <TabsTrigger value="return-client">Return to Client</TabsTrigger>
        </TabsList>
        <TabsContent value="branch">
          <ClearedManifestTab useHook={useBranchManifest} searchKey="waybill_id" />
        </TabsContent>
        <TabsContent value="rider">
          <RiderManifestTab />
        </TabsContent>
        <TabsContent value="return-ho">
          <ClearedManifestTab useHook={useReturnHOManifest} searchKey="waybill_id" />
        </TabsContent>
        <TabsContent value="dd">
          <ClearedManifestTab useHook={useDDManifest} searchKey="waybill_id" showDDDates />
        </TabsContent>
        <TabsContent value="return-client">
          <ReturnClientManifestTab />
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
}: {
  value: string;
  onChange: (v: string) => void;
  onSearch: () => void;
  onReset: () => void;
}) {
  return (
    <Card className="mb-4 mt-4">
      <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Waybill</label>
          <Input
            placeholder="Search waybill…"
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

function ClearedManifestTab({
  useHook,
  searchKey,
  showDDDates,
}: {
  useHook: (params: { page: number; perPage: number; waybill_id?: string }) => ReturnType<
    typeof useBranchManifest
  >;
  searchKey: "waybill_id";
  showDDDates?: boolean;
}) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState("");

  const { data, isFetching, isError } = useHook({
    page,
    perPage: PER_PAGE,
    [searchKey]: applied || undefined,
  } as { page: number; perPage: number; waybill_id?: string });

  const columns: Column<ClearedManifestRow>[] = [
    { header: "Waybill", cell: (r) => <span className="font-medium">{r.waybill_id}</span> },
    { header: "Customer", cell: (r) => r.customer_name },
    { header: "Branch", cell: (r) => r.branch_name ?? "—" },
    { header: "COD", className: "text-right", cell: (r) => formatCurrency(r.cod) },
    {
      header: "Cleared",
      cell: (r) => (
        <StatusBadge status={r.cleared_status === "Cleared" ? "Cleared" : "Not Cleared"} />
      ),
    },
    ...(showDDDates
      ? ([
          {
            header: "Dispatched",
            cell: (r: ClearedManifestRow) => formatDate(r.dispatched_at),
          },
          { header: "Diff. dest.", cell: (r: ClearedManifestRow) => formatDate(r.dd_at) },
        ] as Column<ClearedManifestRow>[])
      : []),
    { header: "Order date", cell: (r) => formatDate(r.order_date) },
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
            Couldn&apos;t load this manifest right now. Check your connection and try again.
          </CardContent>
        </Card>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data?.items}
            isLoading={isFetching && !data}
            rowKey={(r) => r.order_id}
            emptyMessage="No orders in this manifest yet."
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

function RiderManifestTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState("");

  const { data, isFetching, isError } = useRiderManifest({
    page,
    perPage: PER_PAGE,
    waybill_id: applied || undefined,
  });

  const columns: Column<RiderManifestRow>[] = [
    { header: "Waybill", cell: (r) => <span className="font-medium">{r.waybill_id}</span> },
    { header: "Customer", cell: (r) => r.customer_name },
    { header: "Rider", cell: (r) => r.rider_name ?? "—" },
    { header: "Branch", cell: (r) => r.branch_name ?? "—" },
    { header: "COD", className: "text-right", cell: (r) => formatCurrency(r.cod) },
    { header: "Order date", cell: (r) => formatDate(r.order_date) },
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
            Couldn&apos;t load the rider manifest right now. Check your connection and try
            again.
          </CardContent>
        </Card>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data?.items}
            isLoading={isFetching && !data}
            rowKey={(r) => r.order_id}
            emptyMessage="No orders in this manifest yet."
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

function ReturnClientManifestTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState("");

  const { data, isFetching, isError } = useReturnClientManifest({
    page,
    perPage: PER_PAGE,
    waybill_id: applied || undefined,
  });

  const columns: Column<ReturnClientManifestRow>[] = [
    { header: "Waybill", cell: (r) => <span className="font-medium">{r.waybill_id}</span> },
    { header: "Customer", cell: (r) => r.customer_name },
    { header: "Address", cell: (r) => r.address },
    { header: "COD", className: "text-right", cell: (r) => formatCurrency(r.cod) },
    { header: "Order date", cell: (r) => formatDate(r.order_date) },
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
            Couldn&apos;t load this manifest right now. Check your connection and try again.
          </CardContent>
        </Card>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data?.items}
            isLoading={isFetching && !data}
            rowKey={(r) => r.order_id}
            emptyMessage="No orders in this manifest yet."
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
