"use client";

import { useState } from "react";
import { MoreHorizontal, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  useAdminPickups,
  useAssignPickupRider,
  useSetPickupStatus,
} from "@/lib/hooks/use-admin-pickups";
import { useRiders } from "@/lib/hooks/use-admin-riders";
import type { PickupRequest } from "@/types/pickup";
import { getErrorMessage } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

/**
 * Target statuses offered for a pickup request.
 *
 * There is no pickup status catalogue endpoint (unlike orders), so this list
 * is local. The backend still validates what it accepts and rejects the rest,
 * so the worst case is an option that errors — not a silently wrong write.
 * Listed in docs/API-GAPS.md.
 */
const PICKUP_STATUSES = [
  { value: "assigned", label: "Assigned" },
  { value: "collected", label: "Collected" },
  { value: "received_at_branch", label: "Received at branch" },
  { value: "cancelled", label: "Cancelled" },
  { value: "failed", label: "Failed" },
] as const;

export default function AdminPickupsPage() {
  const [clientId, setClientId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [assignTarget, setAssignTarget] = useState<PickupRequest | null>(null);
  const [statusTarget, setStatusTarget] = useState<PickupRequest | null>(null);

  const { data: rows, isFetching, isError } = useAdminPickups({
    client_id: clientId.trim() ? Number(clientId) : undefined,
    status_filter: statusFilter.trim() || undefined,
  });

  const columns: Column<PickupRequest>[] = [
    { header: "Request", cell: (r) => <span className="font-medium">#{r.id}</span> },
    { header: "Client", cell: (r) => `#${r.client_id}` },
    {
      header: "Address",
      cell: (r) => <span className="line-clamp-2 text-sm">{r.pickup_address}</span>,
    },
    { header: "Contact", cell: (r) => r.contact_phone },
    {
      header: "Requested",
      cell: (r) => <span className="text-sm">{formatDate(r.requested_date)}</span>,
    },
    {
      header: "Rider",
      cell: (r) => (r.assigned_rider_id ? `#${r.assigned_rider_id}` : "Unassigned"),
    },
    { header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
    {
      header: "",
      cell: (r) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setAssignTarget(r)}>
              Assign rider
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusTarget(r)}>
              Change status
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      {/*
        One "Change status" action replaces the old cancel / fail / receive
        trio: the API takes a target status and validates it, so three separate
        buttons were three chances to disagree with the server about which
        transitions exist. This endpoint is also unpaged — it returns the whole
        filtered set — so there is no pager below.
      */}
      <PageHeader title="Pickup Operations" description="Client pickup requests." />

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="w-full space-y-1 sm:w-40">
            <label className="text-xs font-medium text-muted-foreground">Client ID</label>
            <Input
              inputMode="numeric"
              placeholder="e.g. 1"
              value={clientId}
              onChange={(e) => setClientId(e.target.value.replace(/\D/g, ""))}
            />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Status filter (comma-separated)
            </label>
            <Input
              placeholder="requested, assigned"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setClientId("");
              setStatusFilter("");
            }}
            disabled={!clientId && !statusFilter}
          >
            <RotateCcw className="size-4" />
            Reset
          </Button>
        </CardContent>
      </Card>

      {isError ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Couldn&apos;t load pickup requests right now.
          </CardContent>
        </Card>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          isLoading={isFetching && !rows}
          rowKey={(r) => r.id}
          emptyMessage="No pickup requests match these filters."
        />
      )}

      <AssignRiderDialog target={assignTarget} onClose={() => setAssignTarget(null)} />
      <ChangeStatusDialog target={statusTarget} onClose={() => setStatusTarget(null)} />
    </>
  );
}

function AssignRiderDialog({
  target,
  onClose,
}: {
  target: PickupRequest | null;
  onClose: () => void;
}) {
  const { data: riders, isLoading } = useRiders();
  const [riderId, setRiderId] = useState("");
  const mutation = useAssignPickupRider();

  const submit = () => {
    if (!target || !riderId) return;
    mutation.mutate(
      { pickupId: target.id, riderId: Number(riderId) },
      {
        onSuccess: () => {
          toast.success("Rider assigned");
          setRiderId("");
          onClose();
        },
        onError: (e) => toast.error(getErrorMessage(e, "Could not assign the rider")),
      }
    );
  };

  return (
    <Dialog open={target !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign a rider</DialogTitle>
          <DialogDescription>
            Pickup request #{target?.id} — {target?.pickup_address}
          </DialogDescription>
        </DialogHeader>
        <Select value={riderId} onValueChange={setRiderId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={isLoading ? "Loading…" : "Select a rider"} />
          </SelectTrigger>
          <SelectContent>
            {riders
              ?.filter((r) => r.is_active)
              .map((r) => (
                <SelectItem key={r.id} value={String(r.id)}>
                  {r.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!riderId || mutation.isPending} onClick={submit}>
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ChangeStatusDialog({
  target,
  onClose,
}: {
  target: PickupRequest | null;
  onClose: () => void;
}) {
  const [status, setStatus] = useState("");
  const mutation = useSetPickupStatus();

  const submit = () => {
    if (!target || !status) return;
    mutation.mutate(
      { pickupId: target.id, status },
      {
        onSuccess: () => {
          toast.success("Status updated");
          setStatus("");
          onClose();
        },
        onError: (e) => toast.error(getErrorMessage(e, "Could not update the status")),
      }
    );
  };

  return (
    <Dialog open={target !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change pickup status</DialogTitle>
          <DialogDescription>
            Pickup request #{target?.id} — currently {target?.status}
          </DialogDescription>
        </DialogHeader>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a status" />
          </SelectTrigger>
          <SelectContent>
            {PICKUP_STATUSES.filter((s) => s.value !== target?.status).map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!status || mutation.isPending} onClick={submit}>
            Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
