"use client";

import { useState } from "react";
import { Plus, Search, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/providers/auth-provider";
import { useBranches, useToggleBranchStatus } from "@/lib/hooks/use-admin-branches";
import type { BranchRow } from "@/types/admin-branch";
import { getErrorMessage } from "@/lib/api/client";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BranchFormDialog } from "@/components/forms/branch-form-dialog";

const PER_PAGE = 15;

export default function AdminBranchesPage() {
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data, isFetching, isError } = useBranches({
    page,
    perPage: PER_PAGE,
    branch_name: appliedSearch || undefined,
  });
  const toggleMutation = useToggleBranchStatus();

  const openCreate = () => {
    setEditingId(null);
    setDialogOpen(true);
  };
  const openEdit = (row: BranchRow) => {
    setEditingId(row.id);
    setDialogOpen(true);
  };

  const columns: Column<BranchRow>[] = [
    { header: "Name", cell: (r) => <span className="font-medium">{r.name}</span> },
    { header: "Address", cell: (r) => r.address },
    { header: "Phone", cell: (r) => r.phone_no },
    {
      header: "Status",
      cell: (r) => (
        <Badge
          className={
            r.status === "active"
              ? "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
              : "border-transparent bg-muted text-muted-foreground"
          }
        >
          {r.status === "active" ? "Active" : "Deactivated"}
        </Badge>
      ),
    },
    {
      header: "",
      className: "text-right",
      cell: (r) =>
        hasPermission("active-branches") || hasPermission("de-active-branches") ? (
          <Button
            size="sm"
            variant="outline"
            disabled={toggleMutation.isPending}
            onClick={(e) => {
              e.stopPropagation();
              toggleMutation.mutate(
                { id: r.id, isActive: r.status !== "active" },
                {
                  onSuccess: () => toast.success("Branch status updated"),
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
        title="Branches"
        description="All branch locations and the cities they service."
        action={
          hasPermission("create-branches") ? (
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              New Branch
            </Button>
          ) : undefined
        }
      />

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Branch name
            </label>
            <Input
              placeholder="Search branch…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setAppliedSearch(search.trim());
                  setPage(1);
                }
              }}
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setAppliedSearch(search.trim());
                setPage(1);
              }}
            >
              <Search className="size-4" />
              Search
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setAppliedSearch("");
                setPage(1);
              }}
            >
              <RotateCcw className="size-4" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {isError ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Couldn&apos;t load branches right now. Check your connection and try again.
          </CardContent>
        </Card>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data?.items}
            isLoading={isFetching && !data}
            rowKey={(r) => r.id}
            onRowClick={hasPermission("edit-branches") ? openEdit : undefined}
            emptyMessage="No branches found."
          />
          <Pagination
            pagination={data?.pagination}
            onPageChange={setPage}
            isLoading={isFetching}
          />
        </>
      )}

      <BranchFormDialog open={dialogOpen} onOpenChange={setDialogOpen} branchId={editingId} />
    </>
  );
}
