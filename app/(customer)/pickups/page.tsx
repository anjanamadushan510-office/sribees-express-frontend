"use client";

import { useState } from "react";
import { Search, RotateCcw, XCircle } from "lucide-react";
import { useClientPickups } from "@/lib/hooks/use-pickups";
import type { PickupRow, PickupListParams } from "@/types/pickup";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { CreatePickupDialog } from "@/components/customer/create-pickup-dialog";
import { CancelPickupDialog } from "@/components/customer/cancel-pickup-dialog";

const PER_PAGE = 10;

function isCancellable(status: string | null): boolean {
  if (!status) return true;
  return !/cancel|complete|received|delivered/i.test(status);
}

export default function PickupsPage() {
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState({ pickup_id: "", pick_address: "" });
  const [filters, setFilters] = useState<PickupListParams>({});
  const [cancelTarget, setCancelTarget] = useState<PickupRow | null>(null);

  const { data, isFetching } = useClientPickups({
    page,
    perPage: PER_PAGE,
    orderByDirection: "desc",
    ...filters,
  });

  const apply = () => {
    setPage(1);
    setFilters({
      pickup_id: draft.pickup_id.trim() || undefined,
      pick_address: draft.pick_address.trim() || undefined,
    });
  };
  const reset = () => {
    setDraft({ pickup_id: "", pick_address: "" });
    setFilters({});
    setPage(1);
  };

  const columns: Column<PickupRow>[] = [
    {
      header: "Pickup ID",
      cell: (r) => <span className="font-medium">{r.pickup_id}</span>,
    },
    { header: "Vehicle", cell: (r) => r.type_name ?? "—" },
    { header: "Orders", className: "text-right", cell: (r) => r.order_count },
    { header: "Rider", cell: (r) => r.rider ?? "—" },
    { header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
    {
      header: "Requested",
      cell: (r) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(r.requested_date)}
        </span>
      ),
    },
    {
      header: "",
      className: "text-right",
      cell: (r) =>
        isCancellable(r.status) ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => setCancelTarget(r)}
          >
            <XCircle className="size-4" />
            Cancel
          </Button>
        ) : null,
    },
  ];

  return (
    <>
      <PageHeader
        title="Pickup Requests"
        description="Schedule pickups and track their status."
        action={<CreatePickupDialog />}
      />

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Pickup ID</label>
            <Input
              placeholder="Pickup ID"
              value={draft.pickup_id}
              onChange={(e) => setDraft((d) => ({ ...d, pickup_id: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && apply()}
            />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Pickup address
            </label>
            <Input
              placeholder="Address"
              value={draft.pick_address}
              onChange={(e) => setDraft((d) => ({ ...d, pick_address: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && apply()}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={apply}>
              <Search className="size-4" />
              Search
            </Button>
            <Button variant="outline" onClick={reset}>
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
        emptyMessage="No pickup requests yet. Create one to get started."
      />
      <Pagination
        pagination={data?.pagination}
        onPageChange={setPage}
        isLoading={isFetching}
      />

      <CancelPickupDialog
        pickup={cancelTarget}
        open={!!cancelTarget}
        onOpenChange={(o) => !o && setCancelTarget(null)}
      />
    </>
  );
}
