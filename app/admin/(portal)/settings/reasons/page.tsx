"use client";

import { useState } from "react";
import { Plus, Search, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/providers/auth-provider";
import { useDeleteReason, useReasons } from "@/lib/hooks/use-admin-reasons";
import type { ReasonRow } from "@/types/admin-reason";
import { getErrorMessage } from "@/lib/api/client";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ReasonFormDialog } from "@/components/forms/reason-form-dialog";

const PER_PAGE = 15;

export default function AdminReasonsPage() {
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data, isFetching, isError } = useReasons({
    page,
    perPage: PER_PAGE,
    reason_name: appliedSearch || undefined,
  });
  const deleteMutation = useDeleteReason();

  const openCreate = () => {
    setEditingId(null);
    setDialogOpen(true);
  };
  const openEdit = (row: ReasonRow) => {
    setEditingId(row.id);
    setDialogOpen(true);
  };

  const columns: Column<ReasonRow>[] = [
    { header: "Reason", cell: (r) => <span className="font-medium">{r.reason}</span> },
    { header: "Type", cell: (r) => r.reason_type ?? "—" },
    {
      header: "",
      className: "text-right",
      cell: (r) =>
        hasPermission("delete-reason") ? (
          <Button
            size="icon-sm"
            variant="ghost"
            disabled={deleteMutation.isPending}
            onClick={(e) => {
              e.stopPropagation();
              if (!window.confirm(`Delete reason "${r.reason}"?`)) return;
              deleteMutation.mutate(r.id, {
                onSuccess: () => toast.success("Reason deleted"),
                onError: (error) =>
                  toast.error(getErrorMessage(error, "Could not delete reason")),
              });
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        ) : null,
    },
  ];

  return (
    <>
      <PageHeader
        title="Reasons"
        description="Standard reason codes used across delivery attempts and remarks."
        action={
          hasPermission("create-reason") ? (
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              New Reason
            </Button>
          ) : undefined
        }
      />

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Reason</label>
            <Input
              placeholder="Search reason…"
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
            Couldn&apos;t load reasons right now. Check your connection and try again.
          </CardContent>
        </Card>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data?.items}
            isLoading={isFetching && !data}
            rowKey={(r) => r.id}
            onRowClick={hasPermission("edit-reason") ? openEdit : undefined}
            emptyMessage="No reasons found."
          />
          <Pagination
            pagination={data?.pagination}
            onPageChange={setPage}
            isLoading={isFetching}
          />
        </>
      )}

      <ReasonFormDialog open={dialogOpen} onOpenChange={setDialogOpen} reasonId={editingId} />
    </>
  );
}
