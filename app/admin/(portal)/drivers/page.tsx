"use client";

import { useMemo, useState } from "react";
import { Search, RotateCcw } from "lucide-react";
import { useRiders } from "@/lib/hooks/use-admin-riders";
import { useGeoBranches } from "@/lib/hooks/use-geo";
import type { Rider } from "@/types/admin-rider";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { RiderBranchesDialog } from "@/components/admin/rider-branches-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminDriversPage() {
  const [search, setSearch] = useState("");
  const [editingBranches, setEditingBranches] = useState<Rider | null>(null);
  const { data: riders, isFetching, isError } = useRiders();
  const { data: branches } = useGeoBranches();
  const branchNameById = useMemo(
    () => new Map((branches ?? []).map((b) => [b.id, b.name])),
    [branches]
  );

  const columns: Column<Rider>[] = [
    { header: "Name", cell: (r) => <span className="font-medium">{r.name}</span> },
    { header: "Email", cell: (r) => r.email },
    { header: "Phone", cell: (r) => r.phone ?? "—" },
    {
      header: "Branches",
      cell: (r) =>
        r.branch_ids.length === 0 ? (
          <span className="text-muted-foreground">None</span>
        ) : (
          r.branch_ids.map((id) => branchNameById.get(id) ?? `#${id}`).join(", ")
        ),
    },
    {
      header: "Status",
      cell: (r) => <StatusBadge status={r.is_active ? "Active" : "Inactive"} />,
    },
    {
      header: "",
      className: "text-right",
      cell: (r) => (
        <Button variant="outline" size="sm" onClick={() => setEditingBranches(r)}>
          Assign branches
        </Button>
      ),
    },
  ];

  /*
    Filtering happens in the browser, and that is defensible only because
    `/fleet/riders` returns the whole roster in one unpaged response — there is
    no server-side search or paging to defer to. It stops being defensible at a
    few hundred riders; both are noted in docs/API-GAPS.md.
  */
  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return riders ?? [];
    return (riders ?? []).filter(
      (r) =>
        r.name.toLowerCase().includes(term) ||
        r.email.toLowerCase().includes(term) ||
        (r.phone ?? "").includes(term)
    );
  }, [riders, search]);

  return (
    <>
      {/*
        No "Add driver" button and no name/email/phone edit dialog: a rider is
        a Staff row, and this API has no staff create/update endpoint. Branch
        assignment is its own fleet-owned relationship, though, with its own
        endpoint — that one action is editable here.
      */}
      <PageHeader
        title="Drivers"
        description="Riders registered on the fleet. Assign branches; other details are read-only until staff management exists in the API."
      />

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Search</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Name, email or phone"
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
            Couldn&apos;t load drivers right now. Check your connection and try again.
          </CardContent>
        </Card>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={rows}
            isLoading={isFetching && !riders}
            rowKey={(r) => r.id}
            emptyMessage={
              search ? "No drivers match that search." : "No drivers registered yet."
            }
          />
          {riders && riders.length > 0 && (
            <p className="px-1 py-3 text-sm text-muted-foreground">
              Showing{" "}
              <span className="font-medium text-foreground">{rows.length}</span> of{" "}
              <span className="font-medium text-foreground">{riders.length}</span> driver
              {riders.length === 1 ? "" : "s"}
            </p>
          )}
        </>
      )}

      <RiderBranchesDialog rider={editingBranches} onClose={() => setEditingBranches(null)} />
    </>
  );
}
