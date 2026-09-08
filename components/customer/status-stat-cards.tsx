"use client";

import type { LucideIcon } from "lucide-react";
import {
  RefreshCw,
  Plane,
  Warehouse,
  MapPin,
  Bike,
  PackageCheck,
  Package,
} from "lucide-react";
import { useStatusStatistics } from "@/lib/hooks/use-dashboard";
import type { StatusCount } from "@/types/dashboard";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkline } from "@/components/charts/sparkline";

/**
 * Icon + colour per status, keyed by the catalogue's `status_key`.
 *
 * These are presentation only. The API sends no colour, and the keys are the
 * backend's semantic ones (`out_for_delivery`) rather than the old opaque
 * `key_6`, so an unrecognised status degrades to a neutral parcel icon instead
 * of disappearing.
 */
const STATUS_META: Record<string, { icon: LucideIcon; color: string }> = {
  processing: { icon: RefreshCw, color: "#3b82f6" },
  collected_from_warehouse: { icon: Warehouse, color: "#10b981" },
  dispatched_to_destination: { icon: Plane, color: "#a855f7" },
  received_at_destination: { icon: MapPin, color: "#f59e0b" },
  out_for_delivery: { icon: Bike, color: "#15803d" },
  delivered: { icon: PackageCheck, color: "#059669" },
};

const CARD_COUNT = 6;

export function StatusStatCards() {
  const { data, isLoading, isError } = useStatusStatistics();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: CARD_COUNT }).map((_, i) => (
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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {data.map((stat) => (
        <StatCard key={stat.status_key} stat={stat} />
      ))}
    </div>
  );
}

function StatCard({ stat }: { stat: StatusCount }) {
  const meta = STATUS_META[stat.status_key];
  const Icon = meta?.icon ?? Package;
  const color = meta?.color ?? "#6b7280";

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
        {stat.count}
      </p>
      <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {stat.status_name}
      </p>
    </Card>
  );
}
