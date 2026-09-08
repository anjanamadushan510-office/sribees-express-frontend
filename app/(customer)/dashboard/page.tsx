"use client";

import Link from "next/link";
import { Package } from "lucide-react";
import { useDashboardTotals } from "@/lib/hooks/use-dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusStatCards } from "@/components/customer/status-stat-cards";

export default function CustomerDashboardPage() {
  const { data: totalOrders, isLoading, isError } = useDashboardTotals();

  return (
    <>
      <h1 className="mb-5 text-2xl font-bold tracking-tight">Dashboard</h1>

      <StatusStatCards />

      <div className="mt-2 flex justify-end">
        <Link
          href="/shipments"
          className="text-sm font-medium text-primary hover:underline"
        >
          View More
        </Link>
      </div>

      {/*
        The monthly-volume area chart that used to sit here is gone: this API
        exposes no time series, only current counts by status. Charting a
        made-up series, or one reconstructed by pulling every order into the
        browser, would look authoritative while being neither accurate nor
        cheap. Total orders is what the summary endpoint actually knows.
        Restoring the chart needs a backend endpoint — see docs/API-GAPS.md.
      */}
      <h2 className="mb-3 mt-4 text-xl font-semibold tracking-tight">Orders</h2>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Total shipments placed</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-16 w-40" />
          ) : isError ? (
            <p className="py-6 text-sm text-muted-foreground">
              Couldn&apos;t load your order total right now.
            </p>
          ) : (
            <div className="flex items-center gap-4 py-2">
              <span className="flex size-12 items-center justify-center rounded-full border-2 border-primary text-primary">
                <Package className="size-6" />
              </span>
              <div>
                <p className="text-4xl font-bold tabular-nums">
                  {totalOrders ?? 0}
                </p>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  across all statuses
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
