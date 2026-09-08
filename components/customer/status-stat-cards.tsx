"use client";

import type { LucideIcon } from "lucide-react";
import {
  RefreshCw,
  Plane,
  Warehouse,
  MapPin,
  Bike,
  Package,
} from "lucide-react";
import { useStatusStatistics } from "@/lib/hooks/use-dashboard";
import type { StatusStat } from "@/types/dashboard";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkline } from "@/components/charts/sparkline";

/** Per-status icon + fallback colour, keyed by PrimaryStatusType key. */
const STATUS_META: Record<string, { icon: LucideIcon; color: string }> = {
  key_1: { icon: RefreshCw, color: "#3b82f6" }, // Processing — blue
  key_4: { icon: Plane, color: "#a855f7" }, // Dispatched — purple
  key_3: { icon: Warehouse, color: "#10b981" }, // Collected from Warehouse — green
  key_5: { icon: MapPin, color: "#f59e0b" }, // Received at Destination — amber
  key_6: { icon: Bike, color: "#15803d" }, // Out for Delivery — dark green
};

export function StatusStatCards() {
  const { data, isLoading, isError } = useStatusStatistics();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="p-5 text-sm text-muted-foreground">
        Couldn&apos;t load your order status summary right now.
      </Card>
    );
  }

  if (!data || data.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {data.map((stat) => (
        <StatCard key={stat.key} stat={stat} />
      ))}
    </div>
  );
}

function StatCard({ stat }: { stat: StatusStat }) {
  const meta = STATUS_META[stat.key];
  const Icon = meta?.icon ?? Package;
  const color = stat.color || meta?.color || "#6b7280";

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <span
          className="flex size-11 items-center justify-center rounded-full border-2"
          style={{ borderColor: color, color }}
        >
          <Icon className="size-5" />
        </span>
        <Sparkline color={color} className="h-9 w-20" />
      </div>
      <p className="mt-3 text-3xl font-bold tabular-nums" style={{ color }}>
        {stat.order_count ?? 0}
      </p>
      <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {stat.name}
      </p>
    </Card>
  );
}
