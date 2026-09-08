"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useCancelPickup } from "@/lib/hooks/use-pickups";
import { getErrorMessage } from "@/lib/api/client";
import type { PickupRow } from "@/types/pickup";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function CancelPickupDialog({
  pickup,
  open,
  onOpenChange,
}: {
  pickup: PickupRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const mutation = useCancelPickup();

  const submit = () => {
    if (!pickup) return;
    if (reason.trim().length < 2) {
      setError("Please provide a reason");
      return;
    }
    mutation.mutate(
      { request_id: pickup.id, reason: reason.trim() },
      {
        onSuccess: () => {
          toast.success("Pickup request cancelled");
          setReason("");
          setError(null);
          onOpenChange(false);
        },
        onError: (e) => toast.error(getErrorMessage(e, "Could not cancel pickup")),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Pickup {pickup?.pickup_id}</DialogTitle>
          <DialogDescription>
            This will cancel the pickup request. Please tell us why.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5 py-2">
          <Label>Reason</Label>
          <Textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setError(null);
            }}
            rows={3}
            placeholder="Reason for cancellation"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Keep request
          </Button>
          <Button
            variant="destructive"
            onClick={submit}
            disabled={mutation.isPending}
          >
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Cancel Pickup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
