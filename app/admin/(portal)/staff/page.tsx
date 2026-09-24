"use client";

import { useState } from "react";
import { KeyRound, Plus, RotateCcw, Search } from "lucide-react";
import { toast } from "sonner";
import {
  useRoles,
  useSetStaffPassword,
  useStaff,
  useUpdateStaff,
} from "@/lib/hooks/use-identity";
import type { Staff } from "@/types/identity";
import { getErrorMessage } from "@/lib/api/client";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { OffsetPagination } from "@/components/shared/offset-pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StaffFormDialog } from "@/components/admin/staff-form-dialog";

const ALL = "__all__";
const PER_PAGE = 20;

/**
 * Staff and riders are one list because they are one table: a rider is a staff
 * member holding the "Delivery Rider" role. The role filter is the rider roster,
 * which is why /admin/drivers can stay a read-only operational view rather than
 * growing a second, divergent way to create people.
 */
export default function AdminStaffPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>(ALL);
  const [activeFilter, setActiveFilter] = useState<string>(ALL);
  const [offset, setOffset] = useState(0);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [creating, setCreating] = useState(false);
  const [resetting, setResetting] = useState<Staff | null>(null);

  const { data: roles } = useRoles("staff");
  const { data, isFetching, isError, error } = useStaff({
    search: search || undefined,
    role_name: roleFilter === ALL ? undefined : roleFilter,
    is_active: activeFilter === ALL ? undefined : activeFilter === "active",
    limit: PER_PAGE,
    offset,
  });
  const update = useUpdateStaff();

  async function setActive(staff: Staff, isActive: boolean) {
    try {
      await update.mutateAsync({ id: staff.id, payload: { is_active: isActive } });
      toast.success(isActive ? `${staff.name} reactivated` : `${staff.name} deactivated`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not change the status"));
    }
  }

  const columns: Column<Staff>[] = [
    { header: "Name", cell: (r) => <span className="font-medium">{r.name}</span> },
    { header: "Email", cell: (r) => r.email },
    { header: "Phone", cell: (r) => r.phone ?? "—" },
    {
      header: "Roles",
      cell: (r) =>
        r.roles.length === 0 ? (
          <span className="text-muted-foreground">None</span>
        ) : (
          r.roles.map((role) => role.name).join(", ")
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
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing(r)}>
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => setResetting(r)}>
            <KeyRound className="mr-2 h-4 w-4" />
            Password
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActive(r, !r.is_active)}
            disabled={update.isPending}
          >
            {r.is_active ? "Deactivate" : "Reactivate"}
          </Button>
        </div>
      ),
    },
  ];

  function reset() {
    setSearchInput("");
    setSearch("");
    setRoleFilter(ALL);
    setActiveFilter(ALL);
    setOffset(0);
  }

  return (
    <>
      <PageHeader
        title="Staff & riders"
        description="A rider is a staff member holding the Delivery Rider role."
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New staff member
          </Button>
        }
      />

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Name or email"
              className="pl-9"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setSearch(searchInput.trim());
                  setOffset(0);
                }
              }}
            />
          </div>
          <Select
            value={roleFilter}
            onValueChange={(v) => {
              setRoleFilter(v);
              setOffset(0);
            }}
          >
            <SelectTrigger className="sm:w-48">
              <SelectValue placeholder="Any role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Any role</SelectItem>
              {(roles ?? []).map((role) => (
                <SelectItem key={role.id} value={role.name}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={activeFilter}
            onValueChange={(v) => {
              setActiveFilter(v);
              setOffset(0);
            }}
          >
            <SelectTrigger className="sm:w-40">
              <SelectValue placeholder="Any status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Any status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setSearch(searchInput.trim());
                setOffset(0);
              }}
            >
              Search
            </Button>
            <Button variant="outline" onClick={reset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {isError && (
        <p className="mb-4 text-sm text-destructive">
          {error instanceof Error ? error.message : "Could not load staff."}
        </p>
      )}

      <DataTable
        columns={columns}
        rows={data?.items}
        isLoading={isFetching && !data}
        rowKey={(r) => r.id}
        emptyMessage="No staff match these filters."
      />
      <OffsetPagination page={data} onOffsetChange={setOffset} isLoading={isFetching} />

      <StaffFormDialog
        open={creating}
        onOpenChange={setCreating}
        roles={roles ?? []}
      />
      <StaffFormDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        roles={roles ?? []}
        staff={editing ?? undefined}
      />
      <ResetStaffPasswordDialog staff={resetting} onClose={() => setResetting(null)} />
    </>
  );
}

function ResetStaffPasswordDialog({
  staff,
  onClose,
}: {
  staff: Staff | null;
  onClose: () => void;
}) {
  const [password, setPassword] = useState("");
  const setStaffPassword = useSetStaffPassword();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!staff) return;
    try {
      await setStaffPassword.mutateAsync({ id: staff.id, password });
      toast.success(`Password set for ${staff.email}`);
      setPassword("");
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not set the password"));
    }
  }

  return (
    <Dialog
      open={staff !== null}
      onOpenChange={(open) => {
        if (!open) {
          setPassword("");
          onClose();
        }
      }}
    >
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Set a new password</DialogTitle>
            <DialogDescription>
              {staff?.email} is signed out everywhere as soon as this is saved.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <Label htmlFor="staff_new_password">New password</Label>
            <Input
              id="staff_new_password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={setStaffPassword.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={setStaffPassword.isPending}>
              {setStaffPassword.isPending ? "Saving…" : "Set password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
