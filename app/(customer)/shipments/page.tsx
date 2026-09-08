"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RotateCcw, Barcode } from "lucide-react";
import { useClientOrders, useClientStatusTypes } from "@/lib/hooks/use-client-orders";
import type { ClientOrder } from "@/types/order";
import { formatCurrency, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { OffsetPagination } from "@/components/shared/offset-pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
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
    cell: (r) => (
      <span className="font-medium">{r.waybill_id ?? `#${r.id}`}</span>
    ),
  },
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
    header: "Address",
    cell: (r) => (
      <span className="line-clamp-2 text-sm">{r.recipient_address}</span>
    ),
  },
  {
    header: "COD",
    className: "text-right",
    cell: (r) => formatCurrency(r.cod_amount),
  },
  {
    header: "Status",
    cell: (r) => <StatusBadge status={r.current_status.name} />,
  },
  {
    header: "Date",
    cell: (r) => (
      <span className="text-sm text-muted-foreground">
        {formatDate(r.created_at)}
      </span>
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
  const [offset, setOffset] = useState(0);
  const [status, setStatus] = useState(ALL);

  const { data: statusTypes } = useClientStatusTypes();
  const { data, isFetching } = useClientOrders({
    limit: PER_PAGE,
    offset,
    status_key: status !== ALL ? status : undefined,
  });

  const changeStatus = (value: string) => {
    setStatus(value);
    // Any filter change invalidates the current offset — staying on it would
    // land the user in the middle of a different result set.
    setOffset(0);
  };

  const reset = () => {
    setStatus(ALL);
    setOffset(0);
  };

  return (
    <>
      {/*
        The "Webhook settings" button is gone: this backend manages webhook
        endpoints under /ecommerce, which authenticates with an API key rather
        than a portal login, so a signed-in client user cannot reach them at
        all. See docs/API-GAPS.md.
      */}
      <PageHeader title="My Shipments" description="Your complete order history." />

      {/*
        The waybill and recipient-name search boxes that used to live here are
        gone. This endpoint filters by status only; searching would have meant
        pulling every order into the browser and filtering there, which is both
        slow and wrong the moment the result set exceeds one page. Server-side
        search needs a backend change — see docs/API-GAPS.md.
      */}
      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="w-full space-y-1 sm:w-64">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <Select value={status} onValueChange={changeStatus}>
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
            <Button variant="outline" onClick={reset} disabled={status === ALL}>
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
        emptyMessage="No shipments match this filter yet."
      />
      <OffsetPagination page={data} onOffsetChange={setOffset} isLoading={isFetching} />
    </>
  );
}
