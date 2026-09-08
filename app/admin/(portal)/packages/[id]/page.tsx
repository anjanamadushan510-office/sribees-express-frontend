"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2, Pause, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/providers/auth-provider";
import {
  useAdminOrder,
  useAdminPrimaryStatusTypes,
  useAdminSortingLayers,
  useCreateAdminOrderRemark,
  useHoldAdminOrder,
  useUpdateAdminOrderStatus,
} from "@/lib/hooks/use-admin-orders";
import { getErrorMessage } from "@/lib/api/client";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
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
import { StatusBadge } from "@/components/shared/status-badge";
import { TrackingTimeline } from "@/components/shared/tracking-timeline";
import type { TrackingStatusEntry } from "@/types/tracking";

const NONE = "__none__";

export default function AdminPackageDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { hasPermission } = useAuth();

  const { data, isLoading, isError } = useAdminOrder(id);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [remarkText, setRemarkText] = useState("");

  const holdMutation = useHoldAdminOrder(id);
  const remarkMutation = useCreateAdminOrderRemark(id);

  const order = data?.order_details;
  const history: TrackingStatusEntry[] = (data?.tracking_history ?? [])
    .slice()
    .reverse()
    .map((t) => ({
      name: t.status_name ?? "Unknown",
      remarks: t.remarks,
      added_date: t.status_created_at ?? "",
    }));

  const submitRemark = () => {
    if (!order || !remarkText.trim()) return;
    remarkMutation.mutate(
      { waybill_id: order.waybill_id, remark: remarkText.trim() },
      {
        onSuccess: () => {
          toast.success("Remark added");
          setRemarkText("");
        },
        onError: (error) => toast.error(getErrorMessage(error, "Could not add remark")),
      }
    );
  };

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
      ) : isError || !order ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Couldn&apos;t load this package. It may not exist, or you may not have
            permission to view it.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Waybill {order.waybill_id}
              </h1>
              {order.order_no && (
                <p className="text-sm text-muted-foreground">
                  Order #{order.order_no} · {order.client_name ?? "—"}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {order.current_status && <StatusBadge status={order.current_status} />}
              <Button size="sm" onClick={() => setStatusDialogOpen(true)}>
                <RefreshCw className="size-4" />
                Update Status
              </Button>
              {hasPermission("hold-status") && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={holdMutation.isPending}
                  onClick={() =>
                    holdMutation.mutate(undefined, {
                      onSuccess: () => toast.success("Order hold status updated"),
                      onError: (error) =>
                        toast.error(getErrorMessage(error, "Could not update hold status")),
                    })
                  }
                >
                  {holdMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Pause className="size-4" />
                  )}
                  Hold
                </Button>
              )}
            </div>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Order details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <Detail label="Customer">{order.customer_name}</Detail>
                <Detail label="Phone">{order.customer_phone_no ?? "—"}</Detail>
                <Detail label="Address" className="sm:col-span-2">
                  {order.customer_address ?? "—"}
                </Detail>
                <Detail label="City / District">
                  {[order.customer_city, order.customer_district]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </Detail>
                <Detail label="Branch">
                  {order.branch_name ?? "—"}
                  {order.temporary_branch && ` → ${order.temporary_branch}`}
                </Detail>
                <Detail label="COD">{formatCurrency(order.cod)}</Detail>
                <Detail label="Collected COD">{formatCurrency(order.collected_cod)}</Detail>
                <Detail label="Weight">{order.weight ?? "—"}</Detail>
                <Detail label="Order date">{formatDate(order.order_date)}</Detail>
                {order.completed_date && (
                  <Detail label="Completed">{formatDate(order.completed_date)}</Detail>
                )}
                {order.description && (
                  <Detail label="Description" className="sm:col-span-2">
                    {order.description}
                  </Detail>
                )}
                {order.remarks && (
                  <Detail label="Note" className="sm:col-span-2">
                    {order.remarks}
                  </Detail>
                )}
              </dl>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Tracking history</CardTitle>
            </CardHeader>
            <CardContent>
              <Separator className="mb-6" />
              <TrackingTimeline history={history} />
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Remarks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.order_remarks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No remarks yet.</p>
              ) : (
                <ul className="space-y-3">
                  {data.order_remarks.map((r) => (
                    <li key={r.id} className="rounded-md border p-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">
                          {r.remark_by ?? "System"}{" "}
                          <span className="text-xs font-normal text-muted-foreground">
                            ({r.remarkable_type ?? "—"})
                          </span>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(r.created_at)}
                        </span>
                      </div>
                      <p className="mt-1 text-muted-foreground">{r.remark}</p>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex flex-col gap-2 sm:flex-row">
                <Textarea
                  placeholder="Add an internal remark…"
                  value={remarkText}
                  onChange={(e) => setRemarkText(e.target.value)}
                  rows={2}
                  className="sm:flex-1"
                />
                <Button
                  className="self-end"
                  disabled={remarkMutation.isPending || !remarkText.trim()}
                  onClick={submitRemark}
                >
                  {remarkMutation.isPending && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>

          {data.reversal_history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Reversal history</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  {data.reversal_history.map((r) => (
                    <li key={r.id} className="rounded-md border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span>
                          {r.from_status ?? "—"} → {r.to_status ?? "—"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(r.order_date)}
                        </span>
                      </div>
                      {r.comment && (
                        <p className="mt-1 text-muted-foreground">{r.comment}</p>
                      )}
                      {r.reversed_by && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          By {r.reversed_by}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <UpdateStatusDialog
            open={statusDialogOpen}
            onOpenChange={setStatusDialogOpen}
            waybillId={order.waybill_id}
            orderId={id}
          />
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
  waybillId,
  orderId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  waybillId: string;
  orderId: number | string;
}) {
  const { data: statusTypes, isLoading: statusesLoading } = useAdminPrimaryStatusTypes();
  const { data: sortingLayers } = useAdminSortingLayers();
  const [statusKey, setStatusKey] = useState("");
  const [sortingLayerId, setSortingLayerId] = useState(NONE);
  const mutation = useUpdateAdminOrderStatus(orderId);

  const submit = () => {
    if (!statusKey) return;
    mutation.mutate(
      {
        waybill_id: waybillId,
        status_key: statusKey,
        ...(sortingLayerId !== NONE ? { sorting_layer_id: Number(sortingLayerId) } : {}),
      },
      {
        onSuccess: () => {
          toast.success("Status updated");
          onOpenChange(false);
          setStatusKey("");
          setSortingLayerId(NONE);
        },
        onError: (error) =>
          toast.error(getErrorMessage(error, "Could not update status")),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update order status</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              New status
            </label>
            <Select value={statusKey} onValueChange={setStatusKey}>
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={statusesLoading ? "Loading…" : "Select a status"}
                />
              </SelectTrigger>
              <SelectContent>
                {statusTypes?.map((s) => (
                  <SelectItem key={s.key} value={s.key}>
                    {s.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Sorting center (optional)
            </label>
            <Select value={sortingLayerId} onValueChange={setSortingLayerId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Not applicable" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Not applicable</SelectItem>
                {sortingLayers?.map((s) => (
                  <SelectItem key={s.key} value={s.key}>
                    {s.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!statusKey || mutation.isPending} onClick={submit}>
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
