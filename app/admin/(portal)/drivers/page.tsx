"use client";

import { useState } from "react";
import { Plus, Search, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/providers/auth-provider";
import { useRiders, useToggleRiderStatus } from "@/lib/hooks/use-admin-riders";
import type { RiderRow } from "@/types/admin-rider";
import { getErrorMessage } from "@/lib/api/client";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { RiderFormDialog } from "@/components/forms/rider-form-dialog";

const PER_PAGE = 15;

export default function AdminDriversPage() {
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState({ rider_name: "", branch_name: "" });
  const [filters, setFilters] = useState<{ rider_name?: string; branch_name?: string }>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data, isFetching, isError } = useRiders({
    page,
    perPage: PER_PAGE,
    ...filters,
  });
  const toggleMutation = useToggleRiderStatus();

  const openCreate = () => {
    setEditingId(null);
    setDialogOpen(true);
  };
  const openEdit = (row: RiderRow) => {
    setEditingId(row.id);
    setDialogOpen(true);
  };

  const applyFilters = () => {
    setPage(1);
    setFilters({
      rider_name: draft.rider_name.trim() || undefined,
      branch_name: draft.branch_name.trim() || undefined,
    });
  };
  const resetFilters = () => {
    setDraft({ rider_name: "", branch_name: "" });
    setFilters({});
    setPage(1);
  };

  const columns: Column<RiderRow>[] = [
    {
      header: "Name",
      cell: (r) => <span className="font-medium">{r.rider_name}</span>,
    },
    { header: "Branch", cell: (r) => r.branch_name },
    {
      header: "Contract",
      cell: (r) => (r.contract_type === "freelance" ? "Freelance" : "Staff"),
    },
    { header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
    { header: "Added by", cell: (r) => r.created_by ?? "—" },
    {
      header: "",
      className: "text-right",
      cell: (r) =>
        hasPermission("active-rider") || hasPermission("deactivate-rider") ? (
          <Button
            size="sm"
            variant="outline"
            disabled={toggleMutation.isPending}
            onClick={(e) => {
              e.stopPropagation();
              toggleMutation.mutate(
                { id: r.id, isActive: r.status !== "active" },
                {
                  onSuccess: () => toast.success("Rider status updated"),
                  onError: (error) =>
                    toast.error(getErrorMessage(error, "Could not update status")),
                }
              );
            }}
          >
            {r.status === "active" ? "Deactivate" : "Activate"}
          </Button>
        ) : null,
    },
  ];

  return (
    <>
      <PageHeader
        title="Drivers"
        description="Delivery riders across all branches."
        action={
          hasPermission("create-rider") ? (
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              New Driver
            </Button>
          ) : undefined
        }
      />

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="min-w-[10rem] flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Rider name
            </label>
            <Input
              placeholder="Search rider…"
              value={draft.rider_name}
              onChange={(e) => setDraft((d) => ({ ...d, rider_name: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            />
          </div>
          <div className="min-w-[10rem] flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Branch</label>
            <Input
              placeholder="Branch name"
              value={draft.branch_name}
              onChange={(e) => setDraft((d) => ({ ...d, branch_name: e.target.value }))}
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
            Couldn&apos;t load drivers right now. Check your connection and try again.
          </CardContent>
        </Card>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data?.items}
            isLoading={isFetching && !data}
            rowKey={(r) => r.id}
            onRowClick={hasPermission("edit-rider") ? openEdit : undefined}
            emptyMessage="No drivers found."
          />
          <Pagination
            pagination={data?.pagination}
            onPageChange={setPage}
            isLoading={isFetching}
          />
        </>
      )}

      <RiderFormDialog open={dialogOpen} onOpenChange={setDialogOpen} riderId={editingId} />
    </>
  );
}
