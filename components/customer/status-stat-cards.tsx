"use client";

import type { LucideIcon } from "lucide-react";
import {
  RefreshCw,
  CalendarClock,
  PackagePlus,
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
  pending: { icon: RefreshCw, color: "#3b82f6" },
  pickup_scheduled: { icon: CalendarClock, color: "#6366f1" },
  picked_up: { icon: PackagePlus, color: "#8b5cf6" },
  collected_at_sorting_center: { icon: Warehouse, color: "#10b981" },
  dispatched_to_destination: { icon: Plane, color: "#a855f7" },
  received_at_destination: { icon: MapPin, color: "#f59e0b" },
  out_for_delivery: { icon: Bike, color: "#15803d" },
  delivered: { icon: PackageCheck, color: "#059669" },
};

const STATUS_GRADIENTS: Record<string, string> = {
  pending: "from-amber-400 via-amber-500 to-yellow-600",
  pickup_scheduled: "from-indigo-500 via-indigo-600 to-blue-700",
  picked_up: "from-violet-500 via-violet-600 to-purple-700",
  collected_at_sorting_center: "from-teal-500 via-teal-600 to-emerald-700",
  dispatched_to_destination: "from-purple-500 via-purple-600 to-indigo-800",
  received_at_destination: "from-orange-400 via-orange-500 to-amber-600",
  out_for_delivery: "from-emerald-400 via-green-500 to-teal-700",
  delivered: "from-emerald-500 via-emerald-600 to-teal-700",
};

const CARD_COUNT = 6;

export function StatusStatCards() {
  const { data, isLoading, isError } = useStatusStatistics();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: CARD_COUNT }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-2xl" />
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
  const gradient = STATUS_GRADIENTS[stat.status_key] ?? "from-slate-600 via-slate-700 to-slate-800";

  return (
    <Card
      className={`group relative overflow-hidden rounded-2xl border-0 bg-gradient-to-br ${gradient} p-5 text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}
    >
      {/* Top-Right Curved Wave Overlay */}
      <div className="absolute -top-10 -right-10 size-36 rounded-full bg-white/15 blur-xs pointer-events-none transition-transform duration-500 group-hover:scale-110" />

      {/* Bottom-Left Curved Overlay */}
      <div className="absolute -bottom-8 -left-8 size-28 rounded-full bg-white/15 blur-xs pointer-events-none transition-transform duration-500 group-hover:scale-110" />

      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <span className="flex size-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-inner group-hover:scale-110 transition-transform duration-300">
            <Icon className="size-5 drop-shadow-xs" />
          </span>
          <Sparkline color="#ffffff" className="h-9 w-20 opacity-90 group-hover:opacity-100 transition-opacity" />
        </div>
        <p className="mt-3 text-3xl font-extrabold tabular-nums tracking-tight text-white drop-shadow-sm">
          {stat.count}
        </p>
        <p className="mt-0.5 text-xs font-bold uppercase tracking-wider text-white/85 drop-shadow-xs">
          {stat.status_name}
        </p>
      </div>
    </Card>
  );
}
