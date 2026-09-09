"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowRightLeft, Bike } from "lucide-react";
import { toast } from "sonner";
import {
  useAdminOrder,
  useAdminOrderHistory,
  useAdminStatusCatalogue,
  useUpdateAdminOrderStatus,
} from "@/lib/hooks/use-admin-orders";
import { useAssignRiderToOrder, useRiders } from "@/lib/hooks/use-admin-riders";
import { getErrorMessage } from "@/lib/api/client";
import { formatCurrency, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { TrackingTimeline } from "@/components/shared/tracking-timeline";
import type { TrackingStatusEntry } from "@/types/tracking";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
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

export default function AdminPackageDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data: order, isLoading } = useAdminOrder(id);
  const { data: history } = useAdminOrderHistory(id);
  const [statusOpen, setStatusOpen] = useState(false);
  const [riderOpen, setRiderOpen] = useState(false);

  const timeline: TrackingStatusEntry[] = (history ?? [])
    .slice()
    .reverse()
    .map((entry) => ({
      name: entry.to_status.name,
      remarks: entry.reason,
      added_date: entry.created_at,
    }));

  return (
    <div className="mx-auto max-w-4xl">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href="/admin/packages">
          <ArrowLeft className="size-4" />
          Back to packages
        </Link>
      </Button>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : !order ? (
        <p className="text-muted-foreground">Order not found.</p>
      ) : (
        <>
          <PageHeader
            title={order.waybill_id ? `Waybill ${order.waybill_id}` : `Order #${order.id}`}
            description={`Client #${order.client_id} · placed ${formatDate(order.created_at)}`}
            action={
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setRiderOpen(true)}>
                  <Bike className="size-4" />
                  Assign rider
                </Button>
                <Button onClick={() => setStatusOpen(true)}>
                  <ArrowRightLeft className="size-4" />
                  Move status
                </Button>
              </div>
            }
          />

          <div className="mb-4">
            <StatusBadge status={order.current_status.name} />
          </div>

          {/*
            The remarks and reversal-history panels that used to be here are
            gone: neither exists on this API. An order's `reason` per status
            transition is the closest thing, and it is already in the timeline
            below. See docs/API-GAPS.md.
          */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Order details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <Detail label="Recipient">{order.recipient_name}</Detail>
                <Detail label="Phone">{order.recipient_phone}</Detail>
                <Detail label="Address" className="sm:col-span-2">
                  {order.recipient_address}
                </Detail>
                <Detail label="COD">{formatCurrency(order.cod_amount)}</Detail>
                <Detail label="COD collected">
                  {formatCurrency(order.collected_cod_amount)}
                </Detail>
                <Detail label="Delivery charge">
                  {order.delivery_charge
                    ? formatCurrency(order.delivery_charge)
                    : "Not priced yet"}
                </Detail>
                <Detail label="Weight">{order.weight_kg} kg</Detail>
                <Detail label="Delivery attempts">{order.delivery_attempts}</Detail>
                <Detail label="Assigned rider">
                  {order.current_rider_id ? `#${order.current_rider_id}` : "Unassigned"}
                </Detail>
                <Detail label="Current branch">
                  {order.current_branch_id ? `#${order.current_branch_id}` : "—"}
                </Detail>
                {order.handover_code_required && (
                  <Detail label="Handover code">
                    {order.handover_verified_at
                      ? `Verified ${formatDate(order.handover_verified_at)}`
                      : `Required (${order.handover_attempts} attempt${
                          order.handover_attempts === 1 ? "" : "s"
                        })`}
                  </Detail>
                )}
                {order.pickup_address && (
                  <Detail label="Pickup from" className="sm:col-span-2">
                    {order.pickup_address}
                  </Detail>
                )}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status history</CardTitle>
            </CardHeader>
            <CardContent>
              <Separator className="mb-6" />
              {timeline.length > 0 ? (
                <TrackingTimeline history={timeline} />
              ) : (
                <p className="py-4 text-sm text-muted-foreground">
                  No status changes recorded yet.
                </p>
              )}
            </CardContent>
          </Card>

          <UpdateStatusDialog
            open={statusOpen}
            onOpenChange={setStatusOpen}
            orderId={id}
            currentStatusKey={order.current_status.key}
          />
          <AssignRiderDialog open={riderOpen} onOpenChange={setRiderOpen} orderId={id} />
        </>
      )}
    </div>
  );
}

function Detail({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}

function UpdateStatusDialog({
  open,
  onOpenChange,
  orderId,
  currentStatusKey,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number | string;
  currentStatusKey: string;
}) {
  const { data: catalogue, isLoading, isError } = useAdminStatusCatalogue();
  const [toStatus, setToStatus] = useState("");
  const [reason, setReason] = useState("");
  const mutation = useUpdateAdminOrderStatus(orderId);

  const submit = () => {
    if (!toStatus) return;
    mutation.mutate(
      { to_status: toStatus, reason: reason.trim() || null },
      {
        onSuccess: () => {
          toast.success("Status updated");
          onOpenChange(false);
          setToStatus("");
          setReason("");
        },
        // The backend validates the transition against its edge graph, so an
        // illegal move comes back as a 4xx with a reason. Showing that beats
        // duplicating the graph here and drifting from it.
        onError: (error) =>
          toast.error(getErrorMessage(error, "Could not update status")),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move order status</DialogTitle>
          <DialogDescription>
            The API rejects transitions its state machine does not allow, and will
            say why.
          </DialogDescription>
        </DialogHeader>

        {isError ? (
          <p className="py-4 text-sm text-destructive">
            The status catalogue is not readable with a staff token on this API, so
            there is no list to choose from. See docs/API-GAPS.md.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                New status
              </label>
              <Select value={toStatus} onValueChange={setToStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={isLoading ? "Loading…" : "Select a status"} />
                </SelectTrigger>
                <SelectContent>
                  {catalogue
                    ?.filter((s) => s.key !== currentStatusKey)
                    .map((s) => (
                      <SelectItem key={s.key} value={s.key}>
                        {s.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Reason (optional)
              </label>
              <Textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Recorded on the status history entry"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!toStatus || mutation.isPending} onClick={submit}>
            Update status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AssignRiderDialog({
  open,
  onOpenChange,
  orderId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number | string;
}) {
  const { data: riders, isLoading } = useRiders();
  const [riderId, setRiderId] = useState("");
  const mutation = useAssignRiderToOrder();

  const submit = () => {
    if (!riderId) return;
    mutation.mutate(
      { orderId, riderId: Number(riderId) },
      {
        onSuccess: () => {
          toast.success("Rider assigned");
          onOpenChange(false);
          setRiderId("");
        },
        onError: (error) =>
          toast.error(getErrorMessage(error, "Could not assign the rider")),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign a rider</DialogTitle>
        </DialogHeader>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Rider</label>
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
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
