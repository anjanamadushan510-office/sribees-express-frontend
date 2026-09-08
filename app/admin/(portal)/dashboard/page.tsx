"use client";

import { Boxes, MapPinned, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/providers/auth-provider";
import {
  useOperationDashboardKpi,
  useOperationDashboardStatus,
  useRefreshOperationDashboardStatus,
} from "@/lib/hooks/use-admin-dashboard";
import {
  useRefreshRegionalDashboard,
  useRegionalStatusesCount,
} from "@/lib/hooks/use-admin-area-manager";
import { getErrorMessage } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboardPage() {
  const { session, hasPermission } = useAuth();
  const {
    data: statusData,
    isLoading: statusLoading,
    isError: statusError,
  } = useOperationDashboardStatus();
  const { data: kpiData, isLoading: kpiLoading } = useOperationDashboardKpi();
  const refreshMutation = useRefreshOperationDashboardStatus();

  const cards = statusData?.status_data ?? [];

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

      {statusError ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Couldn&apos;t load the dashboard figures right now. Check your connection and
            try again.
          </CardContent>
        </Card>
      ) : statusLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No status figures available yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <Card key={c.KeyName}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {c.NAME}
                </CardTitle>
                <Boxes className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{c.count.toLocaleString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Key metrics</CardTitle>
        </CardHeader>
        <CardContent>
          {kpiLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : !kpiData || kpiData.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No KPI snapshot available yet.
            </p>
          ) : (
            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {kpiData.map((kpi) => (
                <div key={kpi.key}>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {prettifyKey(kpi.key)}
                  </dt>
                  <dd className="mt-0.5 font-medium">{formatKpiValue(kpi.value)}</dd>
                </div>
              ))}
            </dl>
          )}
        </CardContent>
      </Card>

      {hasPermission("view-regional-dashboard") && <RegionalDashboardCard />}
    </>
  );
}

function RegionalDashboardCard() {
  const { data, isLoading, isError } = useRegionalStatusesCount();
  const refreshMutation = useRefreshRegionalDashboard();
  const counts = data?.statusCount ?? [];

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <MapPinned className="size-4 text-muted-foreground" />
          <CardTitle className="text-base">Regional overview</CardTitle>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={refreshMutation.isPending}
          onClick={() =>
            refreshMutation.mutate(undefined, {
              onSuccess: () => toast.success("Regional figures refreshed"),
              onError: (error) =>
                toast.error(getErrorMessage(error, "Could not refresh figures")),
            })
          }
        >
          <RefreshCw className={`size-4 ${refreshMutation.isPending ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : isError ? (
          <p className="text-sm text-muted-foreground">
            Couldn&apos;t load regional figures right now.
          </p>
        ) : counts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No status figures available for your branches yet.
          </p>
        ) : (
          <>
            <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3 lg:grid-cols-4">
              {counts.map((c) => (
                <div key={c.status}>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {c.status}
                  </dt>
                  <dd className="mt-0.5 text-lg font-semibold">
                    {c.total_count.toLocaleString()}
                  </dd>
                </div>
              ))}
            </dl>
            {data?.last_update_at && (
              <p className="mt-4 text-xs text-muted-foreground">
                Last updated {formatDate(data.last_update_at)}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function prettifyKey(key: string): string {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatKpiValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") return value.toLocaleString();
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
