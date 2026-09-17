"use client";

import { useMemo, useState } from "react";
import { Plus, RotateCcw, Search } from "lucide-react";
import { useGeoBranches } from "@/lib/hooks/use-geo";
import type { Branch } from "@/types/admin-geo";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { BranchDialog } from "@/components/admin/branch-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const columns: Column<Branch>[] = [
  { header: "Name", cell: (r) => <span className="font-medium">{r.name}</span> },
  { header: "Address", cell: (r) => r.address ?? "—" },
  { header: "Phone", cell: (r) => r.phone_no ?? "—" },
  { header: "Postal cities", className: "text-right", cell: (r) => r.postal_city_count },
  {
    header: "Status",
    cell: (r) => <StatusBadge status={r.is_active ? "Active" : "Inactive"} />,
  },
];

export default function AdminBranchesPage() {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Branch | "new" | null>(null);
  const { data: branches, isFetching, isError } = useGeoBranches();

  // Client-side filter, same reasoning as the Drivers page: /geo/branches
  // returns the whole roster in one unpaged response, so there is no
  // server-side search to defer to, and branches are a human-scale list.
  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return branches ?? [];
    return (branches ?? []).filter(
      (b) =>
        b.name.toLowerCase().includes(term) ||
        (b.address ?? "").toLowerCase().includes(term)
    );
  }, [branches, search]);

  return (
    <>
      <PageHeader
        title="Branches"
        description="All branch locations and the postal cities they cover."
        action={
          <Button onClick={() => setEditing("new")}>
            <Plus className="size-4" />
            New Branch
          </Button>
        }
      />

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Search</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Name or address"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <Button variant="outline" onClick={() => setSearch("")} disabled={!search}>
            <RotateCcw className="size-4" />
            Reset
          </Button>
        </CardContent>
      </Card>

      {isError ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Couldn&apos;t load branches right now. Check your connection and try again.
          </CardContent>
        </Card>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          isLoading={isFetching && !branches}
          rowKey={(r) => r.id}
          onRowClick={(r) => setEditing(r)}
          emptyMessage={search ? "No branches match that search." : "No branches yet."}
        />
      )}

      {editing !== null && (
        <BranchDialog
          branch={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
