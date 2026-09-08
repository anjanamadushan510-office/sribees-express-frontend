"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useMileOperations, useUpdateMileOperationStatus } from "@/lib/hooks/use-admin-mile-operations";
import { useRidersDropdown } from "@/lib/hooks/use-admin-pickups";
import { MILE_OPERATION_STATUSES, type MileOperationRow } from "@/types/admin-mile-operations";
import { getErrorMessage } from "@/lib/api/client";
import { formatCurrency, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const PER_PAGE = 15;
const NONE = "__none__";

export default function AdminMileOperationsPage() {
  const [page, setPage] = useState(1);
  const [statusKey, setStatusKey] = useState(MILE_OPERATION_STATUSES[0].key);
  const [flow, setFlow] = useState<"pickup" | "return">("pickup");
  const [updatingRow, setUpdatingRow] = useState<MileOperationRow | null>(null);

  const { data, isFetching, isError } = useMileOperations({
    page,
    perPage: PER_PAGE,
    statuses: [statusKey],
    is_pickup: flow === "pickup",
  });

  const columns: Column<MileOperationRow>[] = [
    { header: "Waybill", cell: (r) => <span className="font-medium">{r.waybill_id}</span> },
    { header: "Client", cell: (r) => r.client_name ?? "—" },
    { header: "Customer", cell: (r) => r.customer_name },
    { header: "Address", cell: (r) => r.delivery_address },
    { header: "Rider", cell: (r) => r.rider ?? "—" },
    { header: "COD", className: "text-right", cell: (r) => formatCurrency(r.cod) },
    { header: "Date", cell: (r) => formatDate(r.order_date) },
    {
      header: "",
      className: "text-right",
      cell: (r) => (
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            setUpdatingRow(r);
          }}
        >
          Update status
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Mile Operations"
        description="Pickup and return-order last-mile status queue."
      />

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-end">
          <div className="w-full space-y-1 sm:w-72">
            <label className="text-xs font-medium text-muted-foreground">Status queue</label>
            <Select
              value={statusKey}
              onValueChange={(v) => {
                setStatusKey(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MILE_OPERATION_STATUSES.map((s) => (
                  <SelectItem key={s.key} value={s.key}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full space-y-1 sm:w-48">
            <label className="text-xs font-medium text-muted-foreground">Flow</label>
            <Select
              value={flow}
              onValueChange={(v) => {
                setFlow(v as "pickup" | "return");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pickup">Pickup</SelectItem>
                <SelectItem value="return">Return</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isError ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Couldn&apos;t load this queue right now. Check your connection and try again.
          </CardContent>
        </Card>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data?.items}
            isLoading={isFetching && !data}
            rowKey={(r) => r.id}
            emptyMessage="No orders in this queue."
          />
          <Pagination
            pagination={data?.pagination}
            onPageChange={setPage}
            isLoading={isFetching}
          />
        </>
      )}

      <UpdateStatusDialog row={updatingRow} onOpenChange={(o) => !o && setUpdatingRow(null)} />
    </>
  );
}

function UpdateStatusDialog({
  row,
  onOpenChange,
}: {
  row: MileOperationRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: riders, isLoading: ridersLoading } = useRidersDropdown();
  const [targetStatus, setTargetStatus] = useState("");
  const [riderId, setRiderId] = useState(NONE);
  const mutation = useUpdateMileOperationStatus();

  const targetOption = MILE_OPERATION_STATUSES.find((s) => s.key === targetStatus);
  const needsRider = targetOption?.assignsRider ?? false;

  const submit = () => {
    if (!row || !targetStatus) return;
    if (needsRider && riderId === NONE) {
      toast.error("Select a rider for this status");
      return;
    }
    mutation.mutate(
      {
        waybill_id: row.waybill_id,
        status_key: targetStatus,
        ...(needsRider ? { rider_id: Number(riderId) } : {}),
      },
      {
        onSuccess: () => {
          toast.success("Status updated");
          setTargetStatus("");
          setRiderId(NONE);
          onOpenChange(false);
        },
        onError: (error) => toast.error(getErrorMessage(error, "Could not update status")),
      }
    );
  };

  return (
    <Dialog open={row !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update status — {row?.waybill_id}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="mb-1.5 block">New status</Label>
            <Select value={targetStatus} onValueChange={setTargetStatus}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {MILE_OPERATION_STATUSES.map((s) => (
                  <SelectItem key={s.key} value={s.key}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {needsRider && (
            <div>
              <Label className="mb-1.5 block">Rider</Label>
              <Select value={riderId} onValueChange={setRiderId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={ridersLoading ? "Loading…" : "Select rider"} />
                </SelectTrigger>
                <SelectContent>
                  {riders?.map((r) => (
                    <SelectItem key={r.key} value={r.key}>
                      {r.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!targetStatus || mutation.isPending} onClick={submit}>
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
