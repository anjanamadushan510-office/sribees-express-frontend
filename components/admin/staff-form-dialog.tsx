"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useCreateStaff, useUpdateStaff } from "@/lib/hooks/use-identity";
import type { Role, Staff } from "@/types/identity";
import { getErrorMessage } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: Role[];
  /** Absent means create. */
  staff?: Staff;
}

/**
 * The form is a separate, keyed component so that opening the dialog for a
 * different person remounts it with that person's values. Copying props into
 * state from an effect is the alternative, and it is the same shape as the
 * render loops this app has already been bitten by.
 */
export function StaffFormDialog({ open, onOpenChange, roles, staff }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && (
          <StaffForm
            key={staff?.id ?? "new"}
            roles={roles}
            staff={staff}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function StaffForm({
  roles,
  staff,
  onDone,
}: {
  roles: Role[];
  staff?: Staff;
  onDone: () => void;
}) {
  const isEdit = staff !== undefined;
  const [form, setForm] = useState({
    name: staff?.name ?? "",
    email: staff?.email ?? "",
    phone: staff?.phone ?? "",
    password: "",
  });
  const [roleIds, setRoleIds] = useState<number[]>(
    staff?.roles.map((r) => r.id) ?? []
  );
  const create = useCreateStaff();
  const update = useUpdateStaff();
  const pending = create.isPending || update.isPending;

  function toggleRole(roleId: number) {
    setRoleIds((ids) =>
      ids.includes(roleId) ? ids.filter((id) => id !== roleId) : [...ids, roleId]
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      if (isEdit) {
        await update.mutateAsync({
          id: staff.id,
          payload: {
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim() || null,
            role_ids: roleIds,
          },
        });
        toast.success(`${form.name} updated`);
      } else {
        await create.mutateAsync({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          password: form.password,
          role_ids: roleIds,
        });
        toast.success(`${form.name} added`);
      }
      onDone();
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not save"));
    }
  }

  return (
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit staff member" : "New staff member"}</DialogTitle>
            <DialogDescription>
              Give the Delivery Rider role to create a rider — it is what the
              mobile app checks for.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="staff_name">Name</Label>
              <Input
                id="staff_name"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="staff_email">Email</Label>
                <Input
                  id="staff_email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="staff_phone">Phone</Label>
                <Input
                  id="staff_phone"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
            </div>

            {!isEdit && (
              <div className="grid gap-2">
                <Label htmlFor="staff_password">Password</Label>
                <Input
                  id="staff_password"
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label>Roles</Label>
              {roles.length === 0 ? (
                <p className="text-sm text-muted-foreground">No roles defined.</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {roles.map((role) => (
                    <label
                      key={role.id}
                      className="flex items-center gap-2 rounded-md border p-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={roleIds.includes(role.id)}
                        onChange={() => toggleRole(role.id)}
                      />
                      {role.name}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onDone} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : isEdit ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
  );
}
