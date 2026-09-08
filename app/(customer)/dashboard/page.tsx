"use client";

import Link from "next/link";
import { useOrdersChart } from "@/lib/hooks/use-dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusStatCards } from "@/components/customer/status-stat-cards";
import { OrdersAreaChart } from "@/components/charts/orders-area-chart";

export default function CustomerDashboardPage() {
  const { data: chart, isLoading: chartLoading } = useOrdersChart();

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

      <h2 className="mb-3 mt-4 text-xl font-semibold tracking-tight">Orders</h2>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monthly Placed Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {chartLoading ? (
            <Skeleton className="h-[320px] w-full" />
          ) : chart && chart.labels.length > 0 ? (
            <OrdersAreaChart payload={chart} />
          ) : (
            <p className="py-16 text-center text-sm text-muted-foreground">
              No order data to chart yet.
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
