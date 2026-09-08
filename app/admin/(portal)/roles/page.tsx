"use client";

import { useState } from "react";
import { Plus, Search, RotateCcw } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useRoles } from "@/lib/hooks/use-admin-roles";
import type { RoleRow } from "@/types/admin-role";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { RoleFormDialog } from "@/components/forms/role-form-dialog";

const PER_PAGE = 15;

const columns: Column<RoleRow>[] = [
  { header: "Role", cell: (r) => <span className="font-medium">{r.name}</span> },
  { header: "Created", cell: (r) => formatDate(r.created_at) },
];

export default function AdminRolesPage() {
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data, isFetching, isError } = useRoles({
    page,
    perPage: PER_PAGE,
    name: appliedSearch || undefined,
  });

  const openCreate = () => {
    setEditingId(null);
    setDialogOpen(true);
  };
  const openEdit = (row: RoleRow) => {
    setEditingId(row.id);
    setDialogOpen(true);
  };

  const canManage = hasPermission("user-role-edit");

  return (
    <>
      <PageHeader
        title="Roles"
        description="Staff roles and their permissions."
        action={
          canManage ? (
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              New Role
            </Button>
          ) : undefined
        }
      />

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Role name</label>
            <Input
              placeholder="Search role…"
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
            Couldn&apos;t load roles right now. Check your connection and try again.
          </CardContent>
        </Card>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data?.items}
            isLoading={isFetching && !data}
            rowKey={(r) => r.id}
            onRowClick={canManage ? openEdit : undefined}
            emptyMessage="No roles found."
          />
          <Pagination
            pagination={data?.pagination}
            onPageChange={setPage}
            isLoading={isFetching}
          />
        </>
      )}

      <RoleFormDialog open={dialogOpen} onOpenChange={setDialogOpen} roleId={editingId} />
    </>
  );
}
