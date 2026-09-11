"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateRole,
  useDeleteRole,
  usePermissions,
  useRoles,
  useUpdateRole,
} from "@/lib/hooks/use-identity";
import type { Permission, RoleDetail } from "@/types/identity";
import { getErrorMessage } from "@/lib/api/client";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Roles carry permissions; people carry roles.
 *
 * "Super Admin" is checked by name and satisfies every permission, so it holds
 * no permission rows and there is nothing here to edit on it — the API refuses
 * to rename or delete it, and this screen says why rather than offering a
 * button that 4xxs.
 */
export default function AdminRolesPage() {
  const { data: roles, isFetching, isError, error } = useRoles();
  const { data: permissions } = usePermissions();
  const [editing, setEditing] = useState<RoleDetail | null>(null);
  const [creating, setCreating] = useState(false);
  const remove = useDeleteRole();

  async function deleteRole(role: RoleDetail) {
    try {
      await remove.mutateAsync(role.id);
      toast.success(`${role.name} deleted`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not delete the role"));
    }
  }

  const columns: Column<RoleDetail>[] = [
    { header: "Role", cell: (r) => <span className="font-medium">{r.name}</span> },
    {
      header: "Applies to",
      cell: (r) => (r.guard_name === "staff" ? "Staff & riders" : "Merchant logins"),
    },
    {
      header: "Permissions",
      cell: (r) =>
        r.name === "Super Admin" ? (
          <span className="text-muted-foreground">Everything, by name</span>
        ) : r.permissions.length === 0 ? (
          <span className="text-muted-foreground">None</span>
        ) : (
          `${r.permissions.length} granted`
        ),
    },
    {
      header: "",
      className: "text-right",
      cell: (r) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditing(r)}
            disabled={r.name === "Super Admin"}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => deleteRole(r)}
            disabled={remove.isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Roles & permissions"
        description="A permission is checked on every call, read from the database — revoking one takes effect immediately, not when the token expires."
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New role
          </Button>
        }
      />

      {isError && (
        <p className="mb-4 text-sm text-destructive">
          {error instanceof Error ? error.message : "Could not load roles."}
        </p>
      )}

      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            rows={roles}
            isLoading={isFetching && !roles}
            rowKey={(r) => r.id}
            emptyMessage="No roles defined."
          />
        </CardContent>
      </Card>

      <RoleDialog
        open={creating}
        onOpenChange={setCreating}
        permissions={permissions ?? []}
      />
      <RoleDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        permissions={permissions ?? []}
        role={editing ?? undefined}
      />
    </>
  );
}

function RoleDialog({
  open,
  onOpenChange,
  permissions,
  role,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permissions: Permission[];
  role?: RoleDetail;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        {open && (
          <RoleForm
            key={role?.id ?? "new"}
            permissions={permissions}
            role={role}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function RoleForm({
  permissions,
  role,
  onDone,
}: {
  permissions: Permission[];
  role?: RoleDetail;
  onDone: () => void;
}) {
  const isEdit = role !== undefined;
  const [name, setName] = useState(role?.name ?? "");
  const [guardName, setGuardName] = useState<"staff" | "client">(
    (role?.guard_name as "staff" | "client") ?? "staff"
  );
  const [permissionIds, setPermissionIds] = useState<number[]>(
    role?.permissions.map((p) => p.id) ?? []
  );
  const create = useCreateRole();
  const update = useUpdateRole();
  const pending = create.isPending || update.isPending;

  const grouped = useMemo(() => {
    const byCategory = new Map<string, Permission[]>();
    for (const permission of permissions) {
      const key = permission.category ?? "Other";
      byCategory.set(key, [...(byCategory.get(key) ?? []), permission]);
    }
    return [...byCategory.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [permissions]);

  function toggle(permissionId: number) {
    setPermissionIds((ids) =>
      ids.includes(permissionId)
        ? ids.filter((id) => id !== permissionId)
        : [...ids, permissionId]
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      if (isEdit) {
        await update.mutateAsync({
          id: role.id,
          payload: { name: name.trim(), permission_ids: permissionIds },
        });
        toast.success(`${name} updated`);
      } else {
        await create.mutateAsync({
          name: name.trim(),
          guard_name: guardName,
          permission_ids: permissionIds,
        });
        toast.success(`${name} created`);
      }
      onDone();
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not save the role"));
    }
  }

  return (
    <form onSubmit={submit}>
      <DialogHeader>
        <DialogTitle>{isEdit ? `Edit ${role.name}` : "New role"}</DialogTitle>
        <DialogDescription>
          {/*
            role.write is the keys-to-the-building permission: anyone who can
            edit a role can grant themselves anything. Saying so here is cheaper
            than discovering it.
          */}
          Anyone who can edit a role can grant themselves anything it can hold.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="role_name">Name</Label>
            <Input
              id="role_name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          {!isEdit && (
            <div className="grid gap-2">
              <Label htmlFor="guard_name">Applies to</Label>
              <select
                id="guard_name"
                className="h-9 rounded-md border bg-transparent px-3 text-sm"
                value={guardName}
                onChange={(e) => setGuardName(e.target.value as "staff" | "client")}
              >
                <option value="staff">Staff &amp; riders</option>
                <option value="client">Merchant logins</option>
              </select>
            </div>
          )}
        </div>

        <div className="grid gap-3">
          <Label>Permissions</Label>
          <div className="max-h-80 space-y-4 overflow-y-auto rounded-md border p-3">
            {grouped.map(([category, items]) => (
              <div key={category}>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {category}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {items.map((permission) => (
                    <label
                      key={permission.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={permissionIds.includes(permission.id)}
                        onChange={() => toggle(permission.id)}
                      />
                      <code className="font-mono text-xs">{permission.name}</code>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : isEdit ? "Save changes" : "Create role"}
        </Button>
      </DialogFooter>
    </form>
  );
}
