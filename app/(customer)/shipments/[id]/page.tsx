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
  const { data: tracking } = useClientOrderTracking(id);

  // Backend returns tracking oldest-first; show newest-first with current on top.
  const history: TrackingStatusEntry[] = (tracking ?? [])
    .slice()
    .reverse()
    .map((t) => ({
      name: t.status_name ?? "Unknown",
      remarks: t.remarks,
      added_date: t.status_created_at ?? "",
    }));

  const currentStatus = history[0]?.name ?? null;

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
                Waybill {order.waybill_id}
              </h1>
              {order.order_no && (
                <p className="text-sm text-muted-foreground">
                  Order #{order.order_no}
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
                <Detail label="Customer">{order.customer_name}</Detail>
                <Detail label="Phone">
                  {order.phone_no_1 ?? order.phone_no ?? "—"}
                </Detail>
                <Detail label="Address" className="sm:col-span-2">
                  {order.address ?? "—"}
                </Detail>
                <Detail label="COD">{formatCurrency(order.cod)}</Detail>
                <Detail label="Delivery charge">
                  {formatCurrency(order.delivery_charge)}
                </Detail>
                {order.description && (
                  <Detail label="Description" className="sm:col-span-2">
                    {order.description}
                  </Detail>
                )}
                {order.note && (
                  <Detail label="Note" className="sm:col-span-2">
                    {order.note}
                  </Detail>
                )}
                {order.created_at && (
                  <Detail label="Placed">{formatDate(order.created_at)}</Detail>
                )}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tracking history</CardTitle>
            </CardHeader>
            <CardContent>
              <Separator className="mb-6" />
              <TrackingTimeline history={history} />
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
