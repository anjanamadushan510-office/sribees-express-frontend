"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, RotateCcw } from "lucide-react";
import {
  useAdminOrderByWaybill,
  useAdminOrders,
  useAdminStatusCatalogue,
} from "@/lib/hooks/use-admin-orders";
import type { ClientOrder } from "@/types/order";
import type { AdminOrdersListParams } from "@/types/admin-order";
import { formatCurrency, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { OffsetPagination } from "@/components/shared/offset-pagination";
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
const PER_PAGE = 20;

const columns: Column<ClientOrder>[] = [
  {
    header: "Waybill",
    cell: (r) => <span className="font-medium">{r.waybill_id ?? `#${r.id}`}</span>,
  },
  { header: "Client", cell: (r) => `#${r.client_id}` },
  {
    header: "Recipient",
    cell: (r) => (
      <div>
        <div>{r.recipient_name}</div>
        <div className="text-xs text-muted-foreground">{r.recipient_phone}</div>
      </div>
    ),
  },
  {
    header: "COD",
    className: "text-right",
    cell: (r) => formatCurrency(r.cod_amount),
  },
  { header: "Status", cell: (r) => <StatusBadge status={r.current_status.name} /> },
  {
    header: "Created",
    cell: (r) => (
      <span className="text-sm text-muted-foreground">{formatDate(r.created_at)}</span>
    ),
  },
];

export default function AdminPackagesPage() {
  const router = useRouter();
  const [offset, setOffset] = useState(0);
  const [status, setStatus] = useState(ALL);
  const [clientId, setClientId] = useState("");
  const [waybillDraft, setWaybillDraft] = useState("");
  const [waybill, setWaybill] = useState("");

  const params: AdminOrdersListParams = {
    limit: PER_PAGE,
    offset,
    status_key: status !== ALL ? status : undefined,
    client_id: clientId.trim() ? Number(clientId) : undefined,
  };
  const { data, isFetching } = useAdminOrders(params);
  const { data: catalogue } = useAdminStatusCatalogue();

  // Waybill lookup is a different endpoint (an exact match, not a filter), so
  // it runs as its own query and takes over the table when it has a hit.
  const waybillQuery = useAdminOrderByWaybill(waybill);
  const showingWaybill = waybill.trim().length > 0;

  const reset = () => {
    setStatus(ALL);
    setClientId("");
    setWaybillDraft("");
    setWaybill("");
    setOffset(0);
  };

  return (
    <>
      {/*
        No "New order" button: creating an order as staff needs a client_id,
        and this API exposes no way to list or search clients — so the form
        could not be filled in honestly. Merchants create their own orders
        through the portal. See docs/API-GAPS.md.
      */}
      <PageHeader title="Packages" description="Every order across all clients." />

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Waybill</label>
            <Input
              placeholder="Exact waybill number"
              value={waybillDraft}
              onChange={(e) => setWaybillDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setWaybill(waybillDraft.trim())}
            />
          </div>
          <div className="w-full space-y-1 sm:w-40">
            <label className="text-xs font-medium text-muted-foreground">Client ID</label>
            <Input
              inputMode="numeric"
              placeholder="e.g. 1"
              value={clientId}
              onChange={(e) => {
                setClientId(e.target.value.replace(/\D/g, ""));
                setOffset(0);
              }}
            />
          </div>
          <div className="w-full space-y-1 sm:w-56">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v);
                setOffset(0);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All statuses</SelectItem>
                {catalogue?.map((s) => (
                  <SelectItem key={s.key} value={s.key}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setWaybill(waybillDraft.trim())}>
              <Search className="size-4" />
              Find
            </Button>
            <Button variant="outline" onClick={reset}>
              <RotateCcw className="size-4" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {showingWaybill ? (
        <>
          <DataTable
            columns={columns}
            rows={waybillQuery.data ? [waybillQuery.data] : []}
            isLoading={waybillQuery.isFetching}
            rowKey={(r) => r.id}
            onRowClick={(r) => router.push(`/admin/packages/${r.id}`)}
            emptyMessage={`No order with waybill "${waybill}".`}
          />
          <p className="px-1 py-3 text-sm text-muted-foreground">
            Showing an exact waybill match.{" "}
            <button className="underline" onClick={reset}>
              Back to the full list
            </button>
          </p>
        </>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data?.items}
            isLoading={isFetching && !data}
            rowKey={(r) => r.id}
            onRowClick={(r) => router.push(`/admin/packages/${r.id}`)}
            emptyMessage="No orders match these filters."
          />
          <OffsetPagination page={data} onOffsetChange={setOffset} isLoading={isFetching} />
        </>
      )}
    </>
  );
}
