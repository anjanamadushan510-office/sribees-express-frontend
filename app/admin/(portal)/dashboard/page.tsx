"use client";

import { Boxes, Package, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/providers/auth-provider";
import {
  useOperationDashboardStatus,
  useRefreshOperationDashboardStatus,
} from "@/lib/hooks/use-admin-dashboard";
import { getErrorMessage } from "@/lib/api/client";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboardPage() {
  const { session } = useAuth();
  const { data, isLoading, isError } = useOperationDashboardStatus();
  const refreshMutation = useRefreshOperationDashboardStatus();

  const cards = data?.by_status ?? [];

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

      {/*
        The KPI panel and the regional overview that used to sit here are gone:
        this API exposes order counts by status and a per-branch dashboard, but
        no KPI snapshot and no multi-branch regional rollup. Both are listed in
        docs/API-GAPS.md. Refresh is now a client-side refetch — there is no
        server-side figure to recompute, so a button claiming to rebuild one
        would have been theatre.
      */}
      {isError ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Couldn&apos;t load the dashboard figures right now. Check your connection and
            try again.
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <>
          <Card className="mb-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total orders
              </CardTitle>
              <Package className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tabular-nums">
                {(data?.total_orders ?? 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          {cards.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No orders in the system yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {cards.map((c) => (
                <Card key={c.status_key}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {c.status_name}
                    </CardTitle>
                    <Boxes className="size-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold tabular-nums">
                      {c.count.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
