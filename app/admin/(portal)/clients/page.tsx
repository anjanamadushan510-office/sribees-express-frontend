"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, RotateCcw, Search } from "lucide-react";
import { useMerchants } from "@/lib/hooks/use-identity";
import type { Merchant } from "@/types/identity";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { OffsetPagination } from "@/components/shared/offset-pagination";
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
import { NewMerchantDialog } from "./new-merchant-dialog";

const ALL = "__all__";
const PER_PAGE = 20;

const columns: Column<Merchant>[] = [
  {
    header: "Merchant",
    cell: (r) => (
      <div>
        <div className="font-medium">{r.business_name}</div>
        <div className="text-xs text-muted-foreground">#{r.id}</div>
      </div>
    ),
  },
  { header: "Email", cell: (r) => r.email },
  {
    header: "Commission",
    className: "text-right",
    cell: (r) => `${r.commission_percent}%`,
  },
  {
    header: "Status",
    cell: (r) => <StatusBadge status={r.is_active ? "Active" : "Inactive"} />,
  },
];

export default function AdminMerchantsPage() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>(ALL);
  const [offset, setOffset] = useState(0);
  const [creating, setCreating] = useState(false);

  const { data, isFetching, isError, error } = useMerchants({
    search: search || undefined,
    is_active: activeFilter === ALL ? undefined : activeFilter === "active",
    limit: PER_PAGE,
    offset,
  });

  function applySearch() {
    setSearch(searchInput.trim());
    setOffset(0);
  }

  function reset() {
    setSearchInput("");
    setSearch("");
    setActiveFilter(ALL);
    setOffset(0);
  }

  return (
    <>
      <PageHeader
        title="Merchants"
        description="Businesses that ship with us. Open one to manage its logins and API keys."
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New merchant
          </Button>
        }
      />

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Business name or email"
              className="pl-9"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applySearch()}
            />
          </div>
          <Select
            value={activeFilter}
            onValueChange={(v) => {
              setActiveFilter(v);
              setOffset(0);
            }}
          >
            <SelectTrigger className="sm:w-44">
              <SelectValue placeholder="Any status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Any status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button onClick={applySearch}>Search</Button>
            <Button variant="outline" onClick={reset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {isError && (
        <p className="mb-4 text-sm text-destructive">
          {error instanceof Error ? error.message : "Could not load merchants."}
        </p>
      )}

      <DataTable
        columns={columns}
        rows={data?.items}
        isLoading={isFetching && !data}
        rowKey={(r) => r.id}
        onRowClick={(r) => router.push(`/admin/clients/${r.id}`)}
        emptyMessage="No merchants match these filters."
      />
      <OffsetPagination page={data} onOffsetChange={setOffset} isLoading={isFetching} />

      <NewMerchantDialog
        open={creating}
        onOpenChange={setCreating}
        onCreated={(clientId) => router.push(`/admin/clients/${clientId}`)}
      />
    </>
  );
}
