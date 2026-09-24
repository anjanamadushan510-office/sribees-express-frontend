"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, RotateCcw } from "lucide-react";
import { useRiderDeposits } from "@/lib/hooks/use-admin-rider-finances";
import { useRidersDropdown } from "@/lib/hooks/use-admin-pickups";
import type { RiderDepositListParams, RiderDepositRow } from "@/types/admin-rider-finance";
import { formatCurrency, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL = "__all__";
const PER_PAGE = 15;

const columns: Column<RiderDepositRow>[] = [
  { header: "Reference", cell: (r) => <span className="font-medium">{r.reference_no}</span> },
  {
    header: "Rider",
    cell: (r) => (
      <div>
        <div>{r.rider.name}</div>
        <div className="text-xs text-muted-foreground">{r.branch?.name ?? ""}</div>
      </div>
    ),
  },
  { header: "Collected COD", className: "text-right", cell: (r) => formatCurrency(r.collected_cod_amount) },
  { header: "Deposit amount", className: "text-right", cell: (r) => formatCurrency(r.deposit_amount) },
  { header: "Status", cell: (r) => <StatusBadge status={r.status.label} /> },
  { header: "Created", cell: (r) => formatDate(r.created_at) },
];

export default function AdminRiderFinancesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState({ search: "", rider_id: ALL, status: ALL });
  const [filters, setFilters] = useState<RiderDepositListParams>({});

  const { data: riders } = useRidersDropdown();
  const { data, isFetching, isError } = useRiderDeposits({
    page,
    per_page: PER_PAGE,
    ...filters,
  });

  const applyFilters = () => {
    setPage(1);
    setFilters({
      search: draft.search.trim() || undefined,
      rider_id: draft.rider_id !== ALL ? Number(draft.rider_id) : undefined,
      status:
        draft.status !== ALL
          ? (draft.status as RiderDepositListParams["status"])
          : undefined,
    });
  };
  const resetFilters = () => {
    setDraft({ search: "", rider_id: ALL, status: ALL });
    setFilters({});
    setPage(1);
  };

  return (
    <>
      <PageHeader
        title="Rider Finances"
        description="COD collection deposits from delivery riders."
      />

      {data?.summary && (
        <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Pending" value={data.summary.pending_count} />
          <SummaryCard label="Deposited" value={data.summary.deposited_count} />
          <SummaryCard label="Approved" value={data.summary.approved_count} />
          <SummaryCard
            label="Total amount"
            value={formatCurrency(data.summary.total_amount)}
          />
        </div>
      )}

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="min-w-[10rem] flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Search</label>
            <Input
              placeholder="Reference no. or rider name"
              value={draft.search}
              onChange={(e) => setDraft((d) => ({ ...d, search: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            />
          </div>
          <div className="w-full space-y-1 sm:w-52">
            <label className="text-xs font-medium text-muted-foreground">Rider</label>
            <Select value={draft.rider_id} onValueChange={(v) => setDraft((d) => ({ ...d, rider_id: v }))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All riders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All riders</SelectItem>
                {riders?.map((r) => (
                  <SelectItem key={r.key} value={r.key}>
                    {r.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full space-y-1 sm:w-52">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <Select value={draft.status} onValueChange={(v) => setDraft((d) => ({ ...d, status: v }))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="deposited">Deposited</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button onClick={applyFilters}>
              <Search className="size-4" />
              Search
            </Button>
            <Button variant="outline" onClick={resetFilters}>
              <RotateCcw className="size-4" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {isError ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Couldn&apos;t load rider deposits right now. Check your connection and try again.
          </CardContent>
        </Card>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data?.items}
            isLoading={isFetching && !data}
            rowKey={(r) => r.id}
            onRowClick={(r) => router.push(`/admin/rider-finances/${r.id}`)}
            emptyMessage="No deposits match your filters yet."
          />
          <Pagination
            pagination={data?.pagination}
            onPageChange={setPage}
            isLoading={isFetching}
          />
        </>
      )}
    </>
  );
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
