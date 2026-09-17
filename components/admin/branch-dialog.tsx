"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createBranch, updateBranch } from "@/lib/api/admin-geo";
import { useAssignPostalCitiesToBranch, usePostalCities } from "@/lib/hooks/use-geo";
import { getErrorMessage } from "@/lib/api/client";
import type { Branch, BranchCreate, PostalCity } from "@/types/admin-geo";
import { PostalCityAssignmentEditor } from "@/components/shared/postal-city-assignment";
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
  branch: Branch | null;
  onClose: () => void;
}

/**
 * Create/edit a branch, and (once it exists) assign the postal cities it
 * covers directly — the same search-and-add editor the Zone dialog uses,
 * wired to `POST /geo/postal-cities/assign-branch` instead of assign-zone.
 * Coverage isn't part of `BranchCreate`/`BranchUpdate` on the backend, so a
 * brand-new branch is saved first; reopen it (row click) to add cities.
 */
export function BranchDialog({ branch, onClose }: Props) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <BranchForm branch={branch} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
}

function BranchForm({ branch, onClose }: { branch: Branch | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<BranchCreate>({
    name: branch?.name ?? "",
    address: branch?.address ?? "",
    phone_no: branch?.phone_no ?? "",
  });
  const [isActive, setIsActive] = useState(branch?.is_active ?? true);

  const save = useMutation({
    mutationFn: () =>
      branch ? updateBranch(branch.id, { ...form, is_active: isActive }) : createBranch(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["geo-branches"] });
      toast.success(branch ? "Branch updated" : "Branch created");
      onClose();
    },
    onError: (err) => toast.error(getErrorMessage(err, "Could not save the branch")),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <DialogHeader>
        <DialogTitle>{branch ? `Edit ${branch.name}` : "New branch"}</DialogTitle>
        <DialogDescription>
          {branch
            ? "Update this branch's details or the postal cities it covers."
            : "Add its postal cities after creating it — reopen this branch to do that."}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="branch_name">Branch name</Label>
          <Input
            id="branch_name"
            required
            placeholder="Colombo Main"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="branch_address">Address</Label>
          <Input
            id="branch_address"
            required
            placeholder="123 Galle Road, Colombo 03"
            value={form.address ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="branch_phone">Phone number</Label>
          <Input
            id="branch_phone"
            required
            inputMode="numeric"
            placeholder="0112345678"
            value={form.phone_no ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, phone_no: e.target.value }))}
          />
        </div>
        {branch && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Active
          </label>
        )}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={save.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? "Saving…" : branch ? "Save changes" : "Create branch"}
        </Button>
      </DialogFooter>

      {branch && <BranchPostalCities branch={branch} />}
    </form>
  );
}

function BranchPostalCities({ branch }: { branch: Branch }) {
  const assign = useAssignPostalCitiesToBranch();
  const covered = usePostalCities({ branch_id: branch.id, limit: 100 });

  async function add(city: PostalCity) {
    try {
      await assign.mutateAsync({ branch_id: branch.id, postal_city_ids: [city.id] });
      toast.success(`${city.name} now covered by ${branch.name}`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not add this postal city"));
    }
  }

  async function remove(city: PostalCity) {
    try {
      await assign.mutateAsync({ branch_id: branch.id, postal_city_ids: [city.id], detach: true });
      toast.success(`${city.name} removed from ${branch.name}`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not remove this postal city"));
    }
  }

  return (
    <PostalCityAssignmentEditor
      label="Postal cities this branch covers"
      assignedCities={covered.data?.items}
      assignedLoading={covered.isFetching && !covered.data}
      isPending={assign.isPending}
      onAdd={add}
      onRemove={remove}
      emptyMessage="This branch covers no postal cities yet."
    />
  );
}
