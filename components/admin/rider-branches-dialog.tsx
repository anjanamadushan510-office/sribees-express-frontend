"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAssignBranchesToRider } from "@/lib/hooks/use-admin-riders";
import { useGeoBranches } from "@/lib/hooks/use-geo";
import { getErrorMessage } from "@/lib/api/client";
import type { Rider } from "@/types/admin-rider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  rider: Rider | null;
  onClose: () => void;
}

/**
 * Which branch(es) a rider is attached to — a roster, not a rider's own
 * profile field, since a branch decides who its riders are just as much as a
 * rider decides where they work. Mirrors `StaffFormDialog`'s role
 * checkbox-grid: branches are a short, human-scale list, same as roles.
 */
export function RiderBranchesDialog({ rider, onClose }: Props) {
  return (
    <Dialog open={rider !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {rider && <RiderBranchesForm key={rider.id} rider={rider} onDone={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function RiderBranchesForm({ rider, onDone }: { rider: Rider; onDone: () => void }) {
  const { data: branches, isLoading } = useGeoBranches();
  const [branchIds, setBranchIds] = useState<number[]>(rider.branch_ids);
  const assign = useAssignBranchesToRider();

  function toggle(branchId: number) {
    setBranchIds((ids) =>
      ids.includes(branchId) ? ids.filter((id) => id !== branchId) : [...ids, branchId]
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const toAdd = branchIds.filter((id) => !rider.branch_ids.includes(id));
    const toRemove = rider.branch_ids.filter((id) => !branchIds.includes(id));
    try {
      if (toAdd.length > 0) {
        await assign.mutateAsync({ rider_id: rider.id, branch_ids: toAdd });
      }
      if (toRemove.length > 0) {
        await assign.mutateAsync({ rider_id: rider.id, branch_ids: toRemove, detach: true });
      }
      toast.success(`${rider.name}'s branches updated`);
      onDone();
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not update branches"));
    }
  }

  return (
    <form onSubmit={submit}>
      <DialogHeader>
        <DialogTitle>Branches for {rider.name}</DialogTitle>
        <DialogDescription>
          A pickup or a final-mile delivery lands on one of this rider&apos;s branches.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading branches…</p>
        ) : !branches || branches.length === 0 ? (
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
                  onChange={() => toggle(branch.id)}
                />
                {branch.name}
              </label>
            ))}
          </div>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={assign.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={assign.isPending}>
          {assign.isPending ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}
