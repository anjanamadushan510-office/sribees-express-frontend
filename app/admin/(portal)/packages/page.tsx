"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, RotateCcw, Plus } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import {
  useAdminOrders,
  useAdminPrimaryStatusTypes,
} from "@/lib/hooks/use-admin-orders";
import type { AdminOrderRow, AdminOrdersListParams } from "@/types/admin-order";
import { formatCurrency, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL = "__all__";
const PER_PAGE = 15;

const columns: Column<AdminOrderRow>[] = [
  {
    header: "Waybill",
    cell: (r) => <span className="font-medium">{r.waybill_id}</span>,
  },
  {
    header: "Client",
    cell: (r) => (
      <div>
        <div>{r.client_name ?? "—"}</div>
        <div className="text-xs text-muted-foreground">{r.client_no ?? ""}</div>
      </div>
    ),
  },
  {
    header: "Customer",
    cell: (r) => (
      <div>
        <div>{r.customer_name}</div>
        <div className="text-xs text-muted-foreground">{r.phone_no ?? ""}</div>
      </div>
    ),
  },
  {
    header: "Destination",
    cell: (r) => (
      <div className="text-sm">
        {r.city ?? "—"}
        <span className="block text-xs text-muted-foreground">{r.district ?? ""}</span>
      </div>
    ),
  },
  {
    header: "Branch",
    cell: (r) => (
      <div className="text-sm">
        {r.original_branch ?? "—"}
        {r.temporary_branch && (
          <span className="block text-xs text-muted-foreground">
            → {r.temporary_branch}
          </span>
        )}
      </div>
    ),
  },
  {
    header: "Rider",
    cell: (r) => r.rider ?? "—",
  },
  {
    header: "COD",
    className: "text-right",
    cell: (r) => formatCurrency(r.cod),
  },
  {
    header: "Status",
    cell: (r) => <StatusBadge status={r.status} />,
  },
  {
    header: "Date",
    cell: (r) => (
      <span className="text-sm text-muted-foreground">{formatDate(r.order_date)}</span>
    ),
  },
];

export default function AdminPackagesPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState({
    waybill_id: "",
    customer_name: "",
    client_name: "",
    phone_number: "",
    status: ALL,
  });
  const [filters, setFilters] = useState<AdminOrdersListParams>({});

  const { data: statusTypes } = useAdminPrimaryStatusTypes();
  const { data, isFetching, isError } = useAdminOrders({
    page,
    perPage: PER_PAGE,
    orderBy: "order_date",
    orderByDirection: "desc",
    ...filters,
  });

  const applyFilters = () => {
    setPage(1);
    setFilters({
      waybill_id: draft.waybill_id.trim() || undefined,
      customer_name: draft.customer_name.trim() || undefined,
      client_name: draft.client_name.trim() || undefined,
      phone_number: draft.phone_number.trim() || undefined,
      statuses: draft.status !== ALL ? [draft.status] : undefined,
    });
  };

  const resetFilters = () => {
    setDraft({
      waybill_id: "",
      customer_name: "",
      client_name: "",
      phone_number: "",
      status: ALL,
    });
    setFilters({});
    setPage(1);
  };

  return (
    <>
      <PageHeader
        title="Packages"
        description="All orders across every client and branch, with live status."
        action={
          hasPermission("create-orders") ? (
            <Button onClick={() => router.push("/admin/packages/new")}>
              <Plus className="size-4" />
              New Package
            </Button>
          ) : undefined
        }
      />

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="min-w-[10rem] flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Waybill</label>
            <Input
              placeholder="Waybill number"
              value={draft.waybill_id}
              onChange={(e) => setDraft((d) => ({ ...d, waybill_id: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            />
          </div>
          <div className="min-w-[10rem] flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Customer</label>
            <Input
              placeholder="Customer name"
              value={draft.customer_name}
              onChange={(e) =>
                setDraft((d) => ({ ...d, customer_name: e.target.value }))
              }
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            />
          </div>
          <div className="min-w-[10rem] flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Client</label>
            <Input
              placeholder="Client name"
              value={draft.client_name}
              onChange={(e) => setDraft((d) => ({ ...d, client_name: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            />
          </div>
          <div className="min-w-[10rem] flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Phone</label>
            <Input
              placeholder="Phone number"
              value={draft.phone_number}
              onChange={(e) =>
                setDraft((d) => ({ ...d, phone_number: e.target.value }))
              }
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            />
          </div>
          <div className="w-full space-y-1 sm:w-52">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <Select
              value={draft.status}
              onValueChange={(v) => setDraft((d) => ({ ...d, status: v }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All statuses</SelectItem>
                {statusTypes?.map((s) => (
                  <SelectItem key={s.key} value={s.key}>
                    {s.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button onClick={applyFilters}>
              <Search className="size-4" />
              Search
            </Button>
            <Button variant="outline" onClick={resetFilters}>
              <RotateCcw className="size-4" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {isError ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Couldn&apos;t load packages right now. Check your connection and try again.
          </CardContent>
        </Card>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data?.items}
            isLoading={isFetching && !data}
            rowKey={(r) => r.id}
            onRowClick={(r) => router.push(`/admin/packages/${r.id}`)}
            emptyMessage="No packages match your filters yet."
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
