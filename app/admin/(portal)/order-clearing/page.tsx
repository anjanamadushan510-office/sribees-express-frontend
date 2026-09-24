"use client";

import { useState } from "react";
import { Search, RotateCcw, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  useAllOrderClear,
  useClearAllOrder,
  useClearTodayOrder,
  useTodayOrderClear,
} from "@/lib/hooks/use-admin-order-clearing";
import type { AllOrderClearRow, TodayOrderClearRow } from "@/types/admin-order-clearing";
import { getErrorMessage } from "@/lib/api/client";
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

export default function AdminOrderClearingPage() {
  return (
    <>
      <PageHeader
        title="Order Clearing"
        description="Mark waybills as cleared for collection or delivery."
      />
      <Tabs defaultValue="today">
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        <TabsContent value="today">
          <TodayTab />
        </TabsContent>
        <TabsContent value="all">
          <AllTab />
        </TabsContent>
      </Tabs>
    </>
  );
}

function QuickClear({ onClear, isPending }: { onClear: (waybill: string) => void; isPending: boolean }) {
  const [waybill, setWaybill] = useState("");

  return (
    <Card className="mb-4 mt-4">
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Scan or type a waybill to mark it cleared
          </label>
          <Input
            placeholder="Waybill number"
            value={waybill}
            onChange={(e) => setWaybill(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && waybill.trim()) {
                onClear(waybill.trim());
                setWaybill("");
              }
            }}
          />
        </div>
        <Button
          disabled={!waybill.trim() || isPending}
          onClick={() => {
            onClear(waybill.trim());
            setWaybill("");
          }}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <CheckCircle2 className="size-4" />
          )}
          Mark cleared
        </Button>
      </CardContent>
    </Card>
  );
}

function TodayTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState("");

  const { data, isFetching, isError } = useTodayOrderClear({
    page,
    perPage: PER_PAGE,
    waybill_id: applied || undefined,
  });
  const clearMutation = useClearTodayOrder();

  const handleClear = (waybill: string) => {
    clearMutation.mutate(waybill, {
      onSuccess: () => toast.success(`${waybill} marked cleared`),
      onError: (error) => toast.error(getErrorMessage(error, "Could not clear this waybill")),
    });
  };

  const columns: Column<TodayOrderClearRow>[] = [
    { header: "Waybill", cell: (r) => <span className="font-medium">{r.waybill_id}</span> },
    { header: "Customer", cell: (r) => r.customer_name },
    { header: "Warehouse", cell: (r) => r.warehouse ?? "—" },
    { header: "COD", className: "text-right", cell: (r) => formatCurrency(r.cod) },
    {
      header: "Status",
      cell: (r) => (
        <StatusBadge status={r.cleared_status === "Cleared" ? "Cleared" : "Not Cleared"} />
      ),
    },
    { header: "Created", cell: (r) => formatDate(r.created_at) },
  ];

  return (
    <>
      <QuickClear onClear={handleClear} isPending={clearMutation.isPending} />
      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Search waybill
            </label>
            <Input
              placeholder="Waybill number"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setApplied(search.trim());
                  setPage(1);
                }
              }}
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setApplied(search.trim());
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
                setApplied("");
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
            Couldn&apos;t load today&apos;s clearing list right now. Check your connection
            and try again.
          </CardContent>
        </Card>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data?.items}
            isLoading={isFetching && !data}
            rowKey={(r) => r.order_id}
            emptyMessage="No orders to clear today."
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

function AllTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState("");

  const { data, isFetching, isError } = useAllOrderClear({
    page,
    perPage: PER_PAGE,
    waybill_id: applied || undefined,
  });
  const clearMutation = useClearAllOrder();

  const handleClear = (waybill: string) => {
    clearMutation.mutate(waybill, {
      onSuccess: () => toast.success(`${waybill} marked cleared`),
      onError: (error) => toast.error(getErrorMessage(error, "Could not clear this waybill")),
    });
  };

  const columns: Column<AllOrderClearRow>[] = [
    { header: "Waybill", cell: (r) => <span className="font-medium">{r.waybill_id}</span> },
    { header: "Client", cell: (r) => r.client_name ?? "—" },
    { header: "Customer", cell: (r) => r.customer_name },
    { header: "Cleared by", cell: (r) => r.cleared_by ?? "—" },
    {
      header: "Status",
      cell: (r) => <StatusBadge status={r.cleared_status ? "Cleared" : "Not Cleared"} />,
    },
    { header: "Cleared at", cell: (r) => formatDate(r.cleared_at) },
  ];

  return (
    <>
      <QuickClear onClear={handleClear} isPending={clearMutation.isPending} />
      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Search waybill
            </label>
            <Input
              placeholder="Waybill number"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setApplied(search.trim());
                  setPage(1);
                }
              }}
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setApplied(search.trim());
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
                setApplied("");
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
            Couldn&apos;t load the clearing list right now. Check your connection and try
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
