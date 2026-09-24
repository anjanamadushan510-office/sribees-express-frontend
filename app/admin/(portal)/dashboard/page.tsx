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
      bgGradient: "from-emerald-500 via-emerald-600 to-teal-700",
    };
  }
  if (k.includes("failed") || n.includes("failed")) {
    return {
      icon: PackageX,
      bgGradient: "from-rose-500 via-rose-600 to-red-700",
    };
  }
  if (k.includes("pending") || n.includes("pending")) {
    return {
      icon: Clock,
      bgGradient: "from-amber-400 via-amber-500 to-yellow-600",
    };
  }
  if (k.includes("picked") || n.includes("picked")) {
    return {
      icon: PackagePlus,
      bgGradient: "from-violet-500 via-violet-600 to-indigo-700",
    };
  }
  if (k.includes("reschedul") || n.includes("reschedul")) {
    return {
      icon: CalendarClock,
      bgGradient: "from-orange-400 via-orange-500 to-amber-600",
    };
  }
  if (k.includes("return_in_transit") || n.includes("return in transit")) {
    return {
      icon: Truck,
      bgGradient: "from-indigo-500 via-blue-600 to-sky-700",
    };
  }
  if (k.includes("returned_to_branch") || n.includes("returned to branch")) {
    return {
      icon: Building2,
      bgGradient: "from-cyan-500 via-teal-600 to-emerald-700",
    };
  }
  if (k.includes("returned_to_client") || n.includes("returned to client")) {
    return {
      icon: PackageMinus,
      bgGradient: "from-pink-500 via-rose-500 to-pink-700",
    };
  }
  if (k.includes("out_for_delivery") || n.includes("out for delivery")) {
    return {
      icon: Bike,
      bgGradient: "from-teal-400 via-emerald-500 to-green-700",
    };
  }
  if (k.includes("sorting") || n.includes("sorting")) {
    return {
      icon: Warehouse,
      bgGradient: "from-purple-500 via-purple-600 to-indigo-800",
    };
  }
  if (k.includes("dispatched") || n.includes("dispatched")) {
    return {
      icon: Plane,
      bgGradient: "from-sky-400 via-blue-500 to-indigo-700",
    };
  }

  return {
    icon: Boxes,
    bgGradient: "from-slate-600 via-slate-700 to-slate-800",
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

          {/* Grid of Status Cards with Vibrant Colors & Curved Wave Backgrounds */}
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
                const pct = totalOrders > 0 ? ((c.count / totalOrders) * 100).toFixed(1) : "0";
                const pctNum = parseFloat(pct);

                return (
                  <Card
                    key={c.status_key}
                    className={`group relative overflow-hidden rounded-2xl border-0 bg-gradient-to-br ${theme.bgGradient} p-5 text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}
                  >
                    {/* Top-Right Curved Wave Overlay */}
                    <div className="absolute -top-10 -right-10 size-36 rounded-full bg-white/15 blur-xs pointer-events-none transition-transform duration-500 group-hover:scale-110" />

                    {/* Bottom-Left Curved Overlay */}
                    <div className="absolute -bottom-8 -left-8 size-28 rounded-full bg-white/15 blur-xs pointer-events-none transition-transform duration-500 group-hover:scale-110" />

                    <CardContent className="relative z-10 p-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <p className="text-xs font-bold uppercase tracking-wider text-white/85 drop-shadow-xs">
                            {c.status_name}
                          </p>
                          <p className="text-4xl font-extrabold tracking-tight tabular-nums text-white drop-shadow-sm">
                            {c.count.toLocaleString()}
                          </p>
                        </div>

                        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-inner group-hover:scale-110 group-hover:bg-white/30 transition-all duration-300">
                          <Icon className="size-6 drop-shadow-xs" />
                        </div>
                      </div>

                      {/* Share Progress Indicator */}
                      <div className="mt-5 space-y-1.5 border-t border-white/20 pt-3">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-white/80">Share of total</span>
                          <span className="font-extrabold tabular-nums text-white">{pct}%</span>
                        </div>

                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/25 p-[1px]">
                          <div
                            className="h-full rounded-full bg-white transition-all duration-500 shadow-sm"
                            style={{
                              width: `${Math.min(100, Math.max(pctNum > 0 ? 3 : 0, pctNum))}%`,
                            }}
                          />
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


