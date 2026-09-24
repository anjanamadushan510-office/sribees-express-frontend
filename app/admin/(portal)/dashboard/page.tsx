"use client";

import type { LucideIcon } from "lucide-react";
import {
  Package,
  PackageCheck,
  PackageX,
  Clock,
  PackagePlus,
  CalendarClock,
  Truck,
  Building2,
  PackageMinus,
  Bike,
  Warehouse,
  Plane,
  Boxes,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/providers/auth-provider";
import {
  useOperationDashboardStatus,
  useRefreshOperationDashboardStatus,
} from "@/lib/hooks/use-admin-dashboard";
import { getErrorMessage } from "@/lib/api/client";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatusTheme {
  icon: LucideIcon;
  bgGradient: string;
}

function getStatusColorTheme(key: string, name: string): StatusTheme {
  const k = key.toLowerCase();
  const n = name.toLowerCase();

  if (k.includes("delivered") || n.includes("delivered")) {
    return {
      icon: PackageCheck,
      bgGradient: "from-[#689f38] via-[#7cb342] to-[#558b2f]",
    };
  }
  if (k.includes("failed") || n.includes("failed")) {
    return {
      icon: PackageX,
      bgGradient: "from-[#b71c1c] via-[#c62828] to-[#880e4f]",
    };
  }
  if (k.includes("pending") || n.includes("pending")) {
    return {
      icon: Clock,
      bgGradient: "from-[#1e88e5] via-[#2196f3] to-[#1565c0]",
    };
  }
  if (k.includes("picked") || n.includes("picked")) {
    return {
      icon: PackagePlus,
      bgGradient: "from-[#f57c00] via-[#fb8c00] to-[#e65100]",
    };
  }
  if (k.includes("reschedul") || n.includes("reschedul")) {
    return {
      icon: CalendarClock,
      bgGradient: "from-[#fb8c00] via-[#f57c00] to-[#ef6c00]",
    };
  }
  if (k.includes("return_in_transit") || n.includes("return in transit")) {
    return {
      icon: Truck,
      bgGradient: "from-[#6a1b9a] via-[#8e24aa] to-[#4a148c]",
    };
  }
  if (k.includes("returned_to_branch") || n.includes("returned to branch")) {
    return {
      icon: Building2,
      bgGradient: "from-[#00897b] via-[#26a69a] to-[#00695c]",
    };
  }
  if (k.includes("returned_to_client") || n.includes("returned to client")) {
    return {
      icon: PackageMinus,
      bgGradient: "from-[#ad1457] via-[#d81b60] to-[#880e4f]",
    };
  }
  if (k.includes("out_for_delivery") || n.includes("out for delivery")) {
    return {
      icon: Bike,
      bgGradient: "from-[#43a047] via-[#4caf50] to-[#2e7d32]",
    };
  }
  if (k.includes("sorting") || n.includes("sorting")) {
    return {
      icon: Warehouse,
      bgGradient: "from-[#5e35b1] via-[#7e57c2] to-[#4527a0]",
    };
  }
  if (k.includes("dispatched") || n.includes("dispatched")) {
    return {
      icon: Plane,
      bgGradient: "from-[#0288d1] via-[#03a9f4] to-[#01579b]",
    };
  }

  return {
    icon: Boxes,
    bgGradient: "from-[#455a64] via-[#546e7a] to-[#37474f]",
  };
}

export default function AdminDashboardPage() {
  const { session } = useAuth();
  const { data, isLoading, isError } = useOperationDashboardStatus();
  const refreshMutation = useRefreshOperationDashboardStatus();

  const cards = data?.by_status ?? [];
  const totalOrders = data?.total_orders ?? 0;

  return (
    <>
      <PageHeader
        title="Operations Dashboard"
        description={
          session?.roles.length
            ? `Signed in as ${session.roles.join(", ")}`
            : "Branch & head-office operations overview."
        }
        action={
          <Button
            variant="outline"
            size="sm"
            disabled={refreshMutation.isPending}
            onClick={() =>
              refreshMutation.mutate(undefined, {
                onSuccess: () => toast.success("Figures refreshed"),
                onError: (error) =>
                  toast.error(getErrorMessage(error, "Could not refresh figures")),
              })
            }
          >
            <RefreshCw
              className={`size-4 ${refreshMutation.isPending ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        }
      />

      {isError ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Couldn&apos;t load the dashboard figures right now. Check your connection and
            try again.
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-36 w-full rounded-3xl" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-36 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Hero Main KPI Card with Brand Gradient & Organic Wave Shapes */}
          <Card className="group relative overflow-hidden rounded-3xl border-0 bg-gradient-to-br from-[#d6296b] via-[#c41c5c] to-[#7c0a37] p-6 text-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
            {/* Top-Right Organic Wave Circle */}
            <div className="absolute -top-16 -right-16 size-56 rounded-full bg-white/10 blur-xs pointer-events-none transition-transform duration-500 group-hover:scale-110" />
            
            {/* Bottom-Left Wave Circle */}
            <div className="absolute -bottom-12 -left-12 size-40 rounded-full bg-white/10 blur-xs pointer-events-none transition-transform duration-500 group-hover:scale-110" />

            <CardContent className="relative z-10 p-0">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-white/85">
                      Total Orders
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-3 py-0.5 text-[11px] font-bold text-white border border-white/30 shadow-xs">
                      <TrendingUp className="size-3.5" />
                      Live Operation Count
                    </span>
                  </div>
                  <p className="text-5xl font-extrabold tracking-tight tabular-nums text-white drop-shadow-sm">
                    {totalOrders.toLocaleString()}
                  </p>
                </div>

                <div className="flex size-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-inner group-hover:scale-110 group-hover:bg-white/30 transition-all duration-300">
                  <Package className="size-8 drop-shadow-xs" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grid of Status Cards with Vibrant Colors, Dark Curved Waves & Translucent Pills */}
          {cards.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No orders in the system yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {cards.map((c) => {
                const theme = getStatusColorTheme(c.status_key, c.status_name);
                const Icon = theme.icon;
                const pctNum = totalOrders > 0 ? (c.count / totalOrders) * 100 : 0;
                const pctStr = pctNum % 1 === 0 ? pctNum.toFixed(0) : pctNum.toFixed(1);

                return (
                  <Card
                    key={c.status_key}
                    className={`group relative overflow-hidden rounded-2xl border-0 bg-gradient-to-br ${theme.bgGradient} p-5 text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}
                  >
                    {/* Top-Left Dark Wave Shape */}
                    <div className="absolute -top-20 -left-20 size-56 rounded-full bg-black/20 pointer-events-none transition-transform duration-500 group-hover:scale-105" />

                    {/* Top-Right Arc Overlay */}
                    <div className="absolute -top-12 -right-12 size-40 rounded-full border border-white/20 pointer-events-none transition-transform duration-500 group-hover:scale-105" />

                    {/* Bottom-Right Curved Overlay */}
                    <div className="absolute -bottom-14 -right-14 size-44 rounded-full bg-white/10 pointer-events-none transition-transform duration-500 group-hover:scale-105" />

                    <CardContent className="relative z-10 p-0">
                      <div className="flex items-center justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <Icon className="size-4 text-white/90 shrink-0" />
                            <p className="text-sm font-bold tracking-wide text-white drop-shadow-xs truncate">
                              {c.status_name}
                            </p>
                          </div>
                          <p className="text-3xl font-extrabold tracking-tight tabular-nums text-white drop-shadow-sm">
                            {c.count.toLocaleString()}
                          </p>
                          <div className="pt-1.5">
                            <span className="inline-block rounded-md bg-black/20 backdrop-blur-xs px-2.5 py-1 text-xs font-semibold text-white/90 shadow-xs border border-white/10">
                              Total Count : {c.count.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Circular Percentage Ring Indicator */}
                        <div className="relative flex size-16 shrink-0 items-center justify-center">
                          <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                            {/* Background Track Circle */}
                            <circle
                              cx="18"
                              cy="18"
                              r="14"
                              fill="none"
                              className="stroke-black/30"
                              strokeWidth="4"
                            />
                            {/* Animated Progress Circle */}
                            <circle
                              cx="18"
                              cy="18"
                              r="14"
                              fill="none"
                              className="stroke-white transition-all duration-700 ease-out"
                              strokeWidth="4"
                              strokeDasharray="87.96"
                              strokeDashoffset={
                                87.96 - (87.96 * Math.min(100, Math.max(0, pctNum))) / 100
                              }
                              strokeLinecap="round"
                            />
                          </svg>
                          <span className="absolute text-xs font-extrabold text-white tabular-nums drop-shadow-xs">
                            {pctStr}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
}


