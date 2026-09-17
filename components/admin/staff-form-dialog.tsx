"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useCreateStaff, useUpdateStaff } from "@/lib/hooks/use-identity";
import { useAssignBranchesToRider, useRiderBranches } from "@/lib/hooks/use-admin-riders";
import { useGeoBranches } from "@/lib/hooks/use-geo";
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

const RIDER_ROLE_NAME = "Delivery Rider";

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
  const assignBranches = useAssignBranchesToRider();

  const riderRoleId = roles.find((r) => r.name === RIDER_ROLE_NAME)?.id;
  const isRider = riderRoleId !== undefined && roleIds.includes(riderRoleId);
  const { data: branches } = useGeoBranches();
  // Only fetches once staff already exists and is a rider — a brand-new
  // person has no prior assignment to diff against.
  const { data: existingRiderBranches } = useRiderBranches(
    isEdit && isRider ? staff.id : null
  );
  const [branchIds, setBranchIds] = useState<number[]>([]);

  // existingRiderBranches is its own fetch, arriving after the initial
  // render. Adjusting state during rendering (React's own recommended
  // pattern for "seed local state once a value from elsewhere shows up",
  // https://react.dev/learn/you-might-not-need-an-effect) rather than a
  // useEffect, which this repo's lint config flags as a cascading-render
  // risk for exactly this kind of synchronous setState-in-effect.
  const [seededBranchIds, setSeededBranchIds] = useState<number[] | undefined>(undefined);
  if (existingRiderBranches && existingRiderBranches.branch_ids !== seededBranchIds) {
    setSeededBranchIds(existingRiderBranches.branch_ids);
    setBranchIds(existingRiderBranches.branch_ids);
  }

  const pending = create.isPending || update.isPending || assignBranches.isPending;

  function toggleRole(roleId: number) {
    setRoleIds((ids) =>
      ids.includes(roleId) ? ids.filter((id) => id !== roleId) : [...ids, roleId]
    );
  }

  function toggleBranch(branchId: number) {
    setBranchIds((ids) =>
      ids.includes(branchId) ? ids.filter((id) => id !== branchId) : [...ids, branchId]
    );
  }

  /** Add/remove diff against whatever this rider had before, so posting an
   * unchanged selection is a no-op rather than a redundant round trip. */
  async function reconcileBranches(riderId: number) {
    if (!isRider) return;
    const before = existingRiderBranches?.branch_ids ?? [];
    const toAdd = branchIds.filter((id) => !before.includes(id));
    const toRemove = before.filter((id) => !branchIds.includes(id));
    if (toAdd.length > 0) {
      await assignBranches.mutateAsync({ rider_id: riderId, branch_ids: toAdd });
    }
    if (toRemove.length > 0) {
      await assignBranches.mutateAsync({ rider_id: riderId, branch_ids: toRemove, detach: true });
    }
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
        await reconcileBranches(staff.id);
        toast.success(`${form.name} updated`);
      } else {
        const created = await create.mutateAsync({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          password: form.password,
          role_ids: roleIds,
        });
        // Two API calls behind one onboarding action: identity (the staff
        // row) and fleet (which branches a rider works out of) are
        // deliberately separate backend domains — see the "Branches"
        // section below — so a new rider is created, then assigned, rather
        // than in one request.
        try {
          await reconcileBranches(created.id);
        } catch (branchError) {
          toast.error(
            getErrorMessage(branchError, `${form.name} was added, but branches could not be assigned`)
          );
          onDone();
          return;
        }
        toast.success(
          isRider && branchIds.length > 0
            ? `${form.name} added and assigned to ${branchIds.length} branch${branchIds.length === 1 ? "" : "es"}`
            : `${form.name} added`
        );
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

            {isRider && (
              <div className="grid gap-2">
                <Label>Branches</Label>
                <p className="text-xs text-muted-foreground">
                  A pickup or a final-mile delivery lands on one of this rider&apos;s branches.
                </p>
                {!branches || branches.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No branches created yet.</p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {branches.map((branch) => (
                      <label
                        key={branch.id}
                        className="flex items-center gap-2 rounded-md border p-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={branchIds.includes(branch.id)}
                          onChange={() => toggleBranch(branch.id)}
                        />
                        {branch.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
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
