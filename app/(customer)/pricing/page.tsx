"use client";

import { useState } from "react";
import { Search, RotateCcw } from "lucide-react";
import { useRateCard } from "@/lib/hooks/use-rate-card";
import type { RateCardRow, RateCardListParams } from "@/types/pricing";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const PER_PAGE = 10;

const columns: Column<RateCardRow>[] = [
  {
    header: "City",
    cell: (r) => (
      <div>
        <div className="font-medium">{r.city_name}</div>
        <div className="text-xs text-muted-foreground">{r.district_name}</div>
      </div>
    ),
  },
  { header: "Branch", cell: (r) => r.branch_name },
  { header: "First kg", className: "text-right", cell: (r) => r.first_kg },
  { header: "Add. kg", className: "text-right", cell: (r) => r.after_kg },
  {
    header: "Return 1st kg",
    className: "text-right",
    cell: (r) => r.return_first_kg,
  },
  {
    header: "Return add. kg",
    className: "text-right",
    cell: (r) => r.return_after_kg,
  },
];

export default function PricingPage() {
  const [page, setPage] = useState(1);
  const [draftCity, setDraftCity] = useState("");
  const [filters, setFilters] = useState<RateCardListParams>({});

  const { data, isFetching } = useRateCard({
    page,
    perPage: PER_PAGE,
    orderBy: "city_name",
    orderByDirection: "asc",
    ...filters,
  });

  const apply = () => {
    setPage(1);
    setFilters({ city_name: draftCity.trim() || undefined });
  };
  const reset = () => {
    setDraftCity("");
    setFilters({});
    setPage(1);
  };

  return (
    <>
      <PageHeader
        title="Pricing"
        description="Your delivery rates by destination city. All amounts are in LKR."
      />

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">City</label>
            <Input
              placeholder="Search by city name"
              value={draftCity}
              onChange={(e) => setDraftCity(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && apply()}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={apply}>
              <Search className="size-4" />
              Search
            </Button>
            <Button variant="outline" onClick={reset}>
              <RotateCcw className="size-4" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        rows={data?.items}
        isLoading={isFetching && !data}
        rowKey={(r) => r.id}
        emptyMessage="No rate card entries found for your account."
      />
      <Pagination
        pagination={data?.pagination}
        onPageChange={setPage}
        isLoading={isFetching}
      />
    </>
  );
}
