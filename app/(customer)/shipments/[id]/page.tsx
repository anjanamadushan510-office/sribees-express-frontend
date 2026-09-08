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
                  ? `Waybill ${order.waybill_id}`
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
