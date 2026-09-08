"use client";

import { useState } from "react";
import { useClientPickups } from "@/lib/hooks/use-pickups";
import type { PickupRequest } from "@/types/pickup";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { OffsetPagination } from "@/components/shared/offset-pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { CreatePickupDialog } from "@/components/customer/create-pickup-dialog";

const PER_PAGE = 20;

const columns: Column<PickupRequest>[] = [
  {
    header: "Request",
    cell: (r) => <span className="font-medium">#{r.id}</span>,
  },
  {
    header: "Pickup address",
    cell: (r) => <span className="line-clamp-2 text-sm">{r.pickup_address}</span>,
  },
  { header: "Contact", cell: (r) => r.contact_phone },
  {
    header: "Requested for",
    cell: (r) => (
      <span className="text-sm">{formatDate(r.requested_date)}</span>
    ),
  },
  { header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
  {
    header: "Raised",
    cell: (r) => (
      <span className="text-sm text-muted-foreground">
        {formatDate(r.created_at)}
      </span>
    ),
  },
];

export default function PickupsPage() {
  const [offset, setOffset] = useState(0);
  const { data, isFetching } = useClientPickups({ limit: PER_PAGE, offset });

  return (
    <>
      <div className="mb-1 flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title="Pickup Requests"
          description="Ask us to collect parcels from your address."
        />
        <CreatePickupDialog />
      </div>

      {/*
        No search filters and no cancel action here, and neither is an
        oversight: this endpoint takes limit/offset only, and the API has no
        route to cancel a pickup request. A cancel button that always failed,
        or a search box that silently filtered one page, would both be worse
        than their absence. Both are listed in docs/API-GAPS.md.
      */}
      <DataTable
        columns={columns}
        rows={data?.items}
        isLoading={isFetching && !data}
        rowKey={(r) => r.id}
        emptyMessage="You have not requested a pickup yet."
      />
      <OffsetPagination page={data} onOffsetChange={setOffset} isLoading={isFetching} />
    </>
  );
}
