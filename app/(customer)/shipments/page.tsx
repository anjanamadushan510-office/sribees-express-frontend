"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, RotateCcw, Barcode, Webhook } from "lucide-react";
import { useClientOrders, useClientStatusTypes } from "@/lib/hooks/use-client-orders";
import type { ClientOrderRow, ClientOrdersListParams } from "@/types/order";
import { formatCurrency, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { WebhookSettingsDialog } from "@/components/customer/webhook-settings-dialog";
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
const PER_PAGE = 10;

const columns: Column<ClientOrderRow>[] = [
  {
    header: "Waybill",
    cell: (r) => <span className="font-medium">{r.waybill_id}</span>,
  },
  { header: "Order No", cell: (r) => r.order_no ?? "—" },
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
  {
    header: "",
    cell: (r) => (
      <Button asChild variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
        <Link href={`/print/barcode/${r.id}`} target="_blank">
          <Barcode className="size-4" />
        </Link>
      </Button>
    ),
  },
];

export default function ShipmentsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState({ waybill_id: "", customer_name: "", status: ALL });
  const [filters, setFilters] = useState<ClientOrdersListParams>({});
  const [webhookOpen, setWebhookOpen] = useState(false);

  const { data: statusTypes } = useClientStatusTypes();
  const { data, isFetching } = useClientOrders({
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
      statuses: draft.status !== ALL ? [draft.status] : undefined,
    });
  };

  const resetFilters = () => {
    setDraft({ waybill_id: "", customer_name: "", status: ALL });
    setFilters({});
    setPage(1);
  };

  return (
    <>
      <div className="mb-1 flex flex-wrap items-start justify-between gap-3">
        <PageHeader title="My Shipments" description="Your complete order history." />
        <Button variant="outline" onClick={() => setWebhookOpen(true)}>
          <Webhook className="size-4" />
          Webhook settings
        </Button>
      </div>
      <WebhookSettingsDialog open={webhookOpen} onOpenChange={setWebhookOpen} />

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Waybill</label>
            <Input
              placeholder="Waybill number"
              value={draft.waybill_id}
              onChange={(e) => setDraft((d) => ({ ...d, waybill_id: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            />
          </div>
          <div className="flex-1 space-y-1">
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

      <DataTable
        columns={columns}
        rows={data?.items}
        isLoading={isFetching && !data}
        rowKey={(r) => r.id}
        onRowClick={(r) => router.push(`/shipments/${r.id}`)}
        emptyMessage="No shipments match your filters yet."
      />
      <Pagination
        pagination={data?.pagination}
        onPageChange={setPage}
        isLoading={isFetching}
      />
    </>
  );
}
