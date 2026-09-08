"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Search, RotateCcw, Pencil, Loader2 } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import {
  useAdminClientUser,
  useAdminClientUsers,
  useToggleAdminClientUserStatus,
  useUpdateAdminClientUser,
} from "@/lib/hooks/use-admin-client-users";
import { getErrorMessage } from "@/lib/api/client";
import type {
  AdminClientUserRow,
  AdminClientUsersListParams,
  UpdateAdminClientUserPayload,
} from "@/types/admin-client-user";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PER_PAGE = 15;

export default function AdminClientUsersPage() {
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<AdminClientUsersListParams>({});
  const [editId, setEditId] = useState<number | null>(null);

  const { data, isFetching, isError } = useAdminClientUsers({
    page,
    perPage: PER_PAGE,
    ...filters,
  });
  const toggleMutation = useToggleAdminClientUserStatus();

  const applyFilters = () => {
    setPage(1);
    setFilters({ client_name: search.trim() || undefined });
  };
  const resetFilters = () => {
    setSearch("");
    setFilters({});
    setPage(1);
  };

  const columns: Column<AdminClientUserRow>[] = [
    { header: "Client", cell: (r) => <span className="font-medium">{r.client_name}</span> },
    { header: "Username", cell: (r) => r.client_username },
    { header: "Role", cell: (r) => r.role_name ?? "—" },
    { header: "Email", cell: (r) => r.email },
    { header: "Contact", cell: (r) => r.contact_no ?? "—" },
    { header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
    {
      header: "",
      cell: (r) => (
        <div className="flex items-center justify-end gap-1">
          {hasPermission("edit-client-user") && (
            <Button variant="ghost" size="icon-sm" onClick={() => setEditId(r.id)}>
              <Pencil className="size-4" />
            </Button>
          )}
          {(hasPermission("activate-client-user") ||
            hasPermission("deactivate-client-user")) && (
            <Button
              variant="ghost"
              size="sm"
              disabled={toggleMutation.isPending}
              onClick={() =>
                toggleMutation.mutate(
                  { id: r.id, isActive: r.status !== "active" },
                  {
                    onSuccess: () => toast.success("Status updated"),
                    onError: (error) =>
                      toast.error(getErrorMessage(error, "Could not update status")),
                  }
                )
              }
            >
              {r.status === "active" ? "Deactivate" : "Activate"}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Client Users"
        description="Sub-user accounts that log into the customer portal for each client."
      />

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Client name</label>
            <Input
              placeholder="Search client…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
            Couldn&apos;t load client users right now. Check your connection and try again.
          </CardContent>
        </Card>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data?.items}
            isLoading={isFetching && !data}
            rowKey={(r) => r.id}
            emptyMessage="No client users match your filters yet."
          />
          <Pagination pagination={data?.pagination} onPageChange={setPage} isLoading={isFetching} />
        </>
      )}

      <EditClientUserDialog
        open={editId !== null}
        onOpenChange={(o) => !o && setEditId(null)}
        id={editId}
      />
    </>
  );
}

function EditClientUserDialog({
  open,
  onOpenChange,
  id,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  id: number | null;
}) {
  const { data, isLoading } = useAdminClientUser(open ? id : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit client user</DialogTitle>
        </DialogHeader>
        {isLoading || !data ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <EditClientUserForm
            key={data.id}
            initial={data}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function EditClientUserForm({
  initial,
  onDone,
}: {
  initial: { id: number; name: string; nic: string | null; address: string | null; email: string; contact_no: string | null };
  onDone: () => void;
}) {
  const [form, setForm] = useState<UpdateAdminClientUserPayload>({
    name: initial.name,
    nic: initial.nic ?? "",
    address: initial.address ?? "",
    email: initial.email,
    contact_no: initial.contact_no ?? "",
  });
  const mutation = useUpdateAdminClientUser(initial.id);

  const submit = () => {
    mutation.mutate(form, {
      onSuccess: () => {
        toast.success("Client user updated");
        onDone();
      },
      onError: (error) => toast.error(getErrorMessage(error, "Could not update client user")),
    });
  };

  return (
    <>
      <div className="space-y-3">
        <div>
          <Label className="mb-1.5 block">Name</Label>
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <Label className="mb-1.5 block">NIC</Label>
          <Input value={form.nic} onChange={(e) => setForm((f) => ({ ...f, nic: e.target.value }))} />
        </div>
        <div>
          <Label className="mb-1.5 block">Address</Label>
          <Input
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          />
        </div>
        <div>
          <Label className="mb-1.5 block">Email</Label>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </div>
        <div>
          <Label className="mb-1.5 block">Contact number</Label>
          <Input
            value={form.contact_no}
            onChange={(e) => setForm((f) => ({ ...f, contact_no: e.target.value }))}
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button disabled={mutation.isPending} onClick={submit}>
          {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
          Save
        </Button>
      </DialogFooter>
    </>
  );
}
