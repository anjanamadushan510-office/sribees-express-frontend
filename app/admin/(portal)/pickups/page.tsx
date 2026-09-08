"use client";

import { useState } from "react";
import { MoreHorizontal, Search, RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/providers/auth-provider";
import {
  useAdminPickups,
  useAssignPickupRider,
  useCancelAdminPickup,
  useFailAdminPickup,
  useReceivePickupAtBranch,
  useRidersDropdown,
} from "@/lib/hooks/use-admin-pickups";
import type { AdminPickupRow } from "@/types/admin-pickup";
import { getErrorMessage } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const PER_PAGE = 15;

export default function AdminPickupsPage() {
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState({ client_name: "", pickup_branch: "", rider_name: "" });
  const [filters, setFilters] = useState<{
    client_name?: string;
    pickup_branch?: string;
    rider_name?: string;
  }>({});

  const { data, isFetching, isError } = useAdminPickups({
    page,
    perPage: PER_PAGE,
    ...filters,
  });

  const [assignTarget, setAssignTarget] = useState<AdminPickupRow | null>(null);
  const [reasonTarget, setReasonTarget] = useState<{
    row: AdminPickupRow;
    action: "cancel" | "fail";
  } | null>(null);
  const receiveMutation = useReceivePickupAtBranch();

  const applyFilters = () => {
    setPage(1);
    setFilters({
      client_name: draft.client_name.trim() || undefined,
      pickup_branch: draft.pickup_branch.trim() || undefined,
      rider_name: draft.rider_name.trim() || undefined,
    });
  };
  const resetFilters = () => {
    setDraft({ client_name: "", pickup_branch: "", rider_name: "" });
    setFilters({});
    setPage(1);
  };

  const canChangeStatus = hasPermission("pickup-status-change");

  const columns: Column<AdminPickupRow>[] = [
    { header: "Pickup ID", cell: (r) => <span className="font-medium">{r.pickup_id}</span> },
    { header: "Client", cell: (r) => r.name },
    { header: "Branch", cell: (r) => r.pickup_branch ?? "—" },
    { header: "Vehicle", cell: (r) => r.type_name ?? "—" },
    { header: "Rider", cell: (r) => r.rider ?? "Unassigned" },
    { header: "Orders", className: "text-right", cell: (r) => r.order_count },
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
        canChangeStatus ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => setAssignTarget(r)}>
                Assign rider
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={receiveMutation.isPending}
                onClick={() =>
                  receiveMutation.mutate(
                    { request_ids: [r.id] },
                    {
                      onSuccess: () => toast.success("Marked as received at branch"),
                      onError: (error) =>
                        toast.error(getErrorMessage(error, "Could not update pickup")),
                    }
                  )
                }
              >
                Mark received at branch
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setReasonTarget({ row: r, action: "fail" })}>
                Mark as failed
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setReasonTarget({ row: r, action: "cancel" })}
              >
                Cancel pickup
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null,
    },
  ];

  return (
    <>
      <PageHeader
        title="Pickup Requests"
        description="Merchant pickup requests across all branches."
      />

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:flex-wrap sm:items-end">
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
            <label className="text-xs font-medium text-muted-foreground">Branch</label>
            <Input
              placeholder="Pickup branch"
              value={draft.pickup_branch}
              onChange={(e) => setDraft((d) => ({ ...d, pickup_branch: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            />
          </div>
          <div className="min-w-[10rem] flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Rider</label>
            <Input
              placeholder="Rider name"
              value={draft.rider_name}
              onChange={(e) => setDraft((d) => ({ ...d, rider_name: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            />
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
            Couldn&apos;t load pickup requests right now. Check your connection and try
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
            emptyMessage="No pickup requests found."
          />
          <Pagination
            pagination={data?.pagination}
            onPageChange={setPage}
            isLoading={isFetching}
          />
        </>
      )}

      <AssignRiderDialog
        pickup={assignTarget}
        onOpenChange={(open) => !open && setAssignTarget(null)}
      />
      <ReasonDialog
        target={reasonTarget}
        onOpenChange={(open) => !open && setReasonTarget(null)}
      />
    </>
  );
}

function AssignRiderDialog({
  pickup,
  onOpenChange,
}: {
  pickup: AdminPickupRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: riders, isLoading } = useRidersDropdown();
  const [riderId, setRiderId] = useState("");
  const mutation = useAssignPickupRider();

  const submit = () => {
    if (!pickup || !riderId) return;
    mutation.mutate(
      { request_ids: [pickup.id], staff_id: Number(riderId) },
      {
        onSuccess: () => {
          toast.success("Rider assigned");
          setRiderId("");
          onOpenChange(false);
        },
        onError: (error) => toast.error(getErrorMessage(error, "Could not assign rider")),
      }
    );
  };

  return (
    <Dialog open={!!pickup} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign rider — {pickup?.pickup_id}</DialogTitle>
        </DialogHeader>
        <Select value={riderId} onValueChange={setRiderId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={isLoading ? "Loading…" : "Select a rider"} />
          </SelectTrigger>
          <SelectContent>
            {riders?.map((r) => (
              <SelectItem key={r.key} value={r.key}>
                {r.value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!riderId || mutation.isPending} onClick={submit}>
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReasonDialog({
  target,
  onOpenChange,
}: {
  target: { row: AdminPickupRow; action: "cancel" | "fail" } | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [reason, setReason] = useState("");
  const cancelMutation = useCancelAdminPickup();
  const failMutation = useFailAdminPickup();
  const mutation = target?.action === "cancel" ? cancelMutation : failMutation;

  const submit = () => {
    if (!target || !reason.trim()) return;
    mutation.mutate(
      { request_ids: [target.row.id], reason: reason.trim() },
      {
        onSuccess: () => {
          toast.success(target.action === "cancel" ? "Pickup cancelled" : "Pickup marked failed");
          setReason("");
          onOpenChange(false);
        },
        onError: (error) => toast.error(getErrorMessage(error, "Could not update pickup")),
      }
    );
  };

  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {target?.action === "cancel" ? "Cancel" : "Fail"} pickup — {target?.row.pickup_id}
          </DialogTitle>
        </DialogHeader>
        <Textarea
          placeholder="Reason…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            variant="destructive"
            disabled={!reason.trim() || mutation.isPending}
            onClick={submit}
          >
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
