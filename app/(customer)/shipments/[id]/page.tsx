"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  useClientOrder,
  useClientOrderTracking,
} from "@/lib/hooks/use-client-orders";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/status-badge";
import { TrackingTimeline } from "@/components/shared/tracking-timeline";
import type { TrackingStatusEntry } from "@/types/tracking";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data: order, isLoading } = useClientOrder(id);
  const { data: history } = useClientOrderTracking(id);

  // The API returns transitions oldest-first; the timeline reads newest-first
  // with the current status on top.
  const timeline: TrackingStatusEntry[] = (history ?? [])
    .slice()
    .reverse()
    .map((entry) => ({
      name: entry.to_status.name,
      remarks: entry.reason,
      added_date: entry.created_at,
    }));

  // Prefer the order's own current_status over the newest history row: an order
  // always has one, whereas the history can be empty on a freshly created order.
  const currentStatus = order?.current_status.name ?? timeline[0]?.name ?? null;

  // This row is the journey back, vs. this row has a journey back running
  // against it. Both change what the page should say first, and they are
  // never true at once.
  const isReturn = order?.order_kind === "return";
  const isBeingReturned = order?.current_status.key === "return_in_transit";

  return (
    <div className="mx-auto max-w-3xl">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href="/shipments">
          <ArrowLeft className="size-4" />
          Back to shipments
        </Link>
      </Button>

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : order ? (
        <>
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {order.waybill_id
                  ? `${isReturn ? "Return" : "Waybill"} ${order.waybill_id}`
                  : `Order #${order.id}`}
              </h1>
              {order.waybill_id && (
                <p className="text-sm text-muted-foreground">
                  Order #{order.id}
                </p>
              )}
            </div>
            {currentStatus && <StatusBadge status={currentStatus} />}
          </div>

          {/*
            Two different facts, and a merchant opening this page needs
            whichever applies before they read anything else: this parcel is
            on its way back to you, or this row *is* the journey back.
          */}
          {isReturn && (
            <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-800 dark:bg-amber-950/40">
              <p className="font-medium">This parcel is coming back to you.</p>
              <p className="mt-1 text-muted-foreground">
                {order.return_trigger === "failed_delivery"
                  ? "It could not be delivered, so the customer never received it."
                  : "The customer sent it back after delivery."}
                {order.return_reason ? ` Reason: ${order.return_reason}` : ""}
              </p>
              <p className="mt-2 text-muted-foreground">
                Our rider will ask you for a handover code when they arrive. It was sent to
                you when this return was raised — if you cannot find it, ask support to
                issue a new one.
              </p>
            </div>
          )}
          {isBeingReturned && (
            <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-800 dark:bg-amber-950/40">
              <p className="font-medium">A return is on its way back to you.</p>
              <p className="mt-1 text-muted-foreground">
                This parcel is being carried back. It has its own waybill and its own
                tracking — the history below is this order&apos;s outward journey only.
              </p>
            </div>
          )}

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">
                {isReturn ? "Return details" : "Order details"}
              </CardTitle>
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
                  {/* Priced when the order is booked, so it is null until then. */}
                  {order.delivery_charge
                    ? formatCurrency(order.delivery_charge)
                    : "Not priced yet"}
                </Detail>
                <Detail label="Weight">{order.weight_kg} kg</Detail>
                {order.delivery_attempts > 0 && (
                  <Detail label="Delivery attempts">
                    {order.delivery_attempts}
                  </Detail>
                )}
                {order.handover_code_required && (
                  <Detail label="Handover code">
                    {order.handover_verified_at
                      ? `Verified ${formatDate(order.handover_verified_at)}`
                      : "Required at delivery"}
                  </Detail>
                )}
                {order.pickup_address && (
                  <Detail label="Pickup from" className="sm:col-span-2">
                    {order.pickup_location_name
                      ? `${order.pickup_location_name} — ${order.pickup_address}`
                      : order.pickup_address}
                  </Detail>
                )}
                {order.requested_delivery_date && (
                  <Detail label="Requested delivery">
                    {formatDate(order.requested_delivery_date)}
                    {order.requested_delivery_window
                      ? ` (${order.requested_delivery_window})`
                      : ""}
                  </Detail>
                )}
                {order.handling && order.handling.length > 0 && (
                  <Detail label="Handling" className="sm:col-span-2">
                    {order.handling.join(", ")}
                  </Detail>
                )}
                {isReturn && order.parent_order_id !== null && (
                  <Detail label="Return of" className="sm:col-span-2">
                    <Link
                      href={`/shipments/${order.parent_order_id}`}
                      className="underline underline-offset-4"
                    >
                      Order #{order.parent_order_id}
                    </Link>
                  </Detail>
                )}
                {isReturn && order.delivery_charge && (
                  <Detail label="Return fee">
                    {formatCurrency(order.delivery_charge)}
                  </Detail>
                )}
                {/*
                  A partial return. Rendered defensively — the manifest is
                  whatever the booking supplied, and a malformed line should
                  cost this row, not the page.
                */}
                {order.return_items && order.return_items.length > 0 && (
                  <Detail label="Coming back" className="sm:col-span-2">
                    <ul className="mt-1 space-y-0.5">
                      {order.return_items.map((item, i) => (
                        <li key={i}>
                          {String(item.name ?? "Item")}
                          {item.sku ? ` (${String(item.sku)})` : ""} ×{" "}
                          {String(item.quantity ?? 1)}
                        </li>
                      ))}
                    </ul>
                  </Detail>
                )}
                <Detail label="Placed">{formatDate(order.created_at)}</Detail>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tracking history</CardTitle>
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
        </>
      ) : (
        <p className="text-muted-foreground">Order not found.</p>
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
