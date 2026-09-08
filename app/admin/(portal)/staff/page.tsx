"use client";

import { useState } from "react";
import { Plus, Search, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/providers/auth-provider";
import { useStaffList, useToggleStaffStatus } from "@/lib/hooks/use-admin-staff";
import type { StaffRow } from "@/types/admin-staff";
import { getErrorMessage } from "@/lib/api/client";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { StaffFormDialog } from "@/components/forms/staff-form-dialog";

const PER_PAGE = 15;

export default function AdminStaffPage() {
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState({ staff_name: "", role: "", email: "" });
  const [filters, setFilters] = useState<{
    staff_name?: string;
    role?: string;
    email?: string;
  }>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data, isFetching, isError } = useStaffList({
    page,
    perPage: PER_PAGE,
    ...filters,
  });
  const toggleMutation = useToggleStaffStatus();

  const openCreate = () => {
    setEditingId(null);
    setDialogOpen(true);
  };
  const openEdit = (row: StaffRow) => {
    setEditingId(row.id);
    setDialogOpen(true);
  };

  const applyFilters = () => {
    setPage(1);
    setFilters({
      staff_name: draft.staff_name.trim() || undefined,
      role: draft.role.trim() || undefined,
      email: draft.email.trim() || undefined,
    });
  };
  const resetFilters = () => {
    setDraft({ staff_name: "", role: "", email: "" });
    setFilters({});
    setPage(1);
  };

  const columns: Column<StaffRow>[] = [
    { header: "Name", cell: (r) => <span className="font-medium">{r.staff_name}</span> },
    { header: "Role", cell: (r) => r.role_name ?? "—" },
    { header: "Email", cell: (r) => r.email },
    {
      header: "Branch",
      cell: (r) =>
        r.branch_count > 1 ? `${r.branch_name} +${r.branch_count - 1}` : r.branch_name ?? "—",
    },
    { header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
    {
      header: "",
      className: "text-right",
      cell: (r) =>
        hasPermission("activate-staff") || hasPermission("deactivate-staff") ? (
          <Button
            size="sm"
            variant="outline"
            disabled={toggleMutation.isPending}
            onClick={(e) => {
              e.stopPropagation();
              toggleMutation.mutate(
                { id: r.id, isActive: r.status.toLowerCase() !== "active" },
                {
                  onSuccess: () => toast.success("Staff status updated"),
                  onError: (error) =>
                    toast.error(getErrorMessage(error, "Could not update status")),
                }
              );
            }}
          >
            {r.status.toLowerCase() === "active" ? "Deactivate" : "Activate"}
          </Button>
        ) : null,
    },
  ];

  return (
    <>
      <PageHeader
        title="Staff"
        description="Head-office and branch staff accounts."
        action={
          hasPermission("create-staff") ? (
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              New Staff
            </Button>
          ) : undefined
        }
      />

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="min-w-[10rem] flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Name</label>
            <Input
              placeholder="Search staff…"
              value={draft.staff_name}
              onChange={(e) => setDraft((d) => ({ ...d, staff_name: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            />
          </div>
          <div className="min-w-[10rem] flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Role</label>
            <Input
              placeholder="Role name"
              value={draft.role}
              onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value }))}
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
            Couldn&apos;t load staff right now. Check your connection and try again.
          </CardContent>
        </Card>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data?.items}
            isLoading={isFetching && !data}
            rowKey={(r) => r.id}
            onRowClick={hasPermission("edit-staff") ? openEdit : undefined}
            emptyMessage="No staff found."
          />
          <Pagination
            pagination={data?.pagination}
            onPageChange={setPage}
            isLoading={isFetching}
          />
        </>
      )}

      <StaffFormDialog open={dialogOpen} onOpenChange={setDialogOpen} staffId={editingId} />
    </>
  );
}
