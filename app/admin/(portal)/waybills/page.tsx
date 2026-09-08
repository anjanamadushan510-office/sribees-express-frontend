"use client";

import { useState } from "react";
import { Plus, Search, RotateCcw, Ban, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/providers/auth-provider";
import {
  useRejectWaybillRequest,
  useRestoreWaybillRequest,
  useWaybillRequests,
} from "@/lib/hooks/use-admin-waybills";
import type { WaybillRequestRow } from "@/types/admin-waybill";
import { getErrorMessage } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { WaybillRequestDialog } from "@/components/forms/waybill-request-dialog";

const PER_PAGE = 15;

export default function AdminWaybillsPage() {
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isFetching, isError } = useWaybillRequests({
    page,
    perPage: PER_PAGE,
    client: appliedSearch || undefined,
  });
  const rejectMutation = useRejectWaybillRequest();
  const restoreMutation = useRestoreWaybillRequest();

  const canRequest = hasPermission("request-waybill");

  const columns: Column<WaybillRequestRow>[] = [
    {
      header: "Client",
      cell: (r) => (
        <div>
          <div className="font-medium">{r.client ?? "—"}</div>
          <div className="text-xs text-muted-foreground">{r.client_no ?? ""}</div>
        </div>
      ),
    },
    { header: "Range", cell: (r) => `${r.from_barcode} – ${r.to_barcode}` },
    { header: "Waybills", className: "text-right", cell: (r) => r.quantity },
    { header: "Barcodes", className: "text-right", cell: (r) => r.barcode_quantity },
    { header: "Status", cell: (r) => <StatusBadge status={r.request_status} /> },
    {
      header: "Requested",
      cell: (r) => (
        <span className="text-sm text-muted-foreground">{formatDate(r.created_at)}</span>
      ),
    },
    {
      header: "",
      className: "text-right",
      cell: (r) => {
        if (r.request_status === "Rejected") {
          return hasPermission("restore-waybill-request") ? (
            <Button
              size="sm"
              variant="outline"
              disabled={restoreMutation.isPending}
              onClick={(e) => {
                e.stopPropagation();
                restoreMutation.mutate(r.id, {
                  onSuccess: () => toast.success("Request restored"),
                  onError: (error) =>
                    toast.error(getErrorMessage(error, "Could not restore request")),
                });
              }}
            >
              <RotateCw className="size-4" />
              Restore
            </Button>
          ) : null;
        }
        return hasPermission("reject-waybill-request") ? (
          <Button
            size="sm"
            variant="outline"
            disabled={rejectMutation.isPending}
            onClick={(e) => {
              e.stopPropagation();
              if (!window.confirm(`Reject waybill request for ${r.client ?? "this client"}?`))
                return;
              rejectMutation.mutate(r.id, {
                onSuccess: () => toast.success("Request rejected"),
                onError: (error) =>
                  toast.error(getErrorMessage(error, "Could not reject request")),
              });
            }}
          >
            <Ban className="size-4" />
            Reject
          </Button>
        ) : null;
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Waybill Requests"
        description="Bulk waybill / barcode range allocations to clients."
        action={
          canRequest ? (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="size-4" />
              New Request
            </Button>
          ) : undefined
        }
      />

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Client</label>
            <Input
              placeholder="Search client…"
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
            Couldn&apos;t load waybill requests right now. Check your connection and try
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
            emptyMessage="No waybill requests found."
          />
          <Pagination
            pagination={data?.pagination}
            onPageChange={setPage}
            isLoading={isFetching}
          />
        </>
      )}

      <WaybillRequestDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
