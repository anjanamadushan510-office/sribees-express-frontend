"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, RotateCcw } from "lucide-react";
import { useAdminClients } from "@/lib/hooks/use-admin-clients";
import type { AdminClientListParams, AdminClientRow } from "@/types/admin-client";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const PER_PAGE = 15;

const columns: Column<AdminClientRow>[] = [
  {
    header: "Client",
    cell: (r) => (
      <div>
        <div className="font-medium">{r.client_name}</div>
        <div className="text-xs text-muted-foreground">{r.client_number}</div>
      </div>
    ),
  },
  {
    header: "Contact",
    cell: (r) => (
      <div className="text-sm">
        {r.email ?? "—"}
        <span className="block text-xs text-muted-foreground">{r.address ?? ""}</span>
      </div>
    ),
  },
  { header: "Pickup branch", cell: (r) => r.pickup_branch ?? "—" },
  { header: "Nearest city", cell: (r) => r.nearest_city ?? "—" },
  { header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
];

export default function AdminClientsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState({ client_name: "", client_no: "", email: "" });
  const [filters, setFilters] = useState<AdminClientListParams>({});

  const { data, isFetching, isError } = useAdminClients({
    page,
    perPage: PER_PAGE,
    ...filters,
  });

  const applyFilters = () => {
    setPage(1);
    setFilters({
      client_name: draft.client_name.trim() || undefined,
      client_no: draft.client_no.trim() || undefined,
      email: draft.email.trim() || undefined,
    });
  };
  const resetFilters = () => {
    setDraft({ client_name: "", client_no: "", email: "" });
    setFilters({});
    setPage(1);
  };

  return (
    <>
      <PageHeader
        title="Clients"
        description="All merchant accounts — status, rate cards, tax, marketing, and API access."
      />

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="min-w-[10rem] flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Client name</label>
            <Input
              placeholder="Search client…"
              value={draft.client_name}
              onChange={(e) => setDraft((d) => ({ ...d, client_name: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            />
          </div>
          <div className="min-w-[10rem] flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Client no.</label>
            <Input
              placeholder="Client number"
              value={draft.client_no}
              onChange={(e) => setDraft((d) => ({ ...d, client_no: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            />
          </div>
          <div className="min-w-[10rem] flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Email</label>
            <Input
              placeholder="Email"
              value={draft.email}
              onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            />
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
            Couldn&apos;t load clients right now. Check your connection and try again.
          </CardContent>
        </Card>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data?.items}
            isLoading={isFetching && !data}
            rowKey={(r) => r.client_id}
            onRowClick={(r) => router.push(`/admin/clients/${r.client_id}`)}
            emptyMessage="No clients match your filters yet."
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
