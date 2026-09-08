"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Truck } from "lucide-react";
import { useCreatePickup } from "@/lib/hooks/use-pickups";
import { getErrorMessage } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * The fields here are exactly what `POST /client-portal/pickup-requests`
 * accepts. The old form asked for a vehicle type and an order count; neither
 * exists on this API, and collecting them would have meant showing the customer
 * a promise the request does not carry.
 */
const schema = z.object({
  pickup_address: z.string().trim().min(5, "Enter the full pickup address"),
  contact_phone: z
    .string()
    .trim()
    .min(9, "Enter a contact phone number")
    .max(20, "That phone number looks too long"),
  requested_date: z.string().min(1, "Pick a date"),
});
type FormValues = z.input<typeof schema>;

/** Today in YYYY-MM-DD, local time — the earliest date worth offering. */
function today(): string {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

export function CreatePickupDialog() {
  const [open, setOpen] = useState(false);
  const mutation = useCreatePickup();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { pickup_address: "", contact_phone: "", requested_date: today() },
  });

  const onSubmit = (values: FormValues) => {
    mutation.mutate(
      {
        pickup_address: values.pickup_address,
        contact_phone: values.contact_phone,
        requested_date: values.requested_date,
      },
      {
        onSuccess: () => {
          toast.success("Pickup request created");
          form.reset({ pickup_address: "", contact_phone: "", requested_date: today() });
          setOpen(false);
        },
        onError: (e) =>
          toast.error(getErrorMessage(e, "Could not create pickup request")),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Truck className="size-4" />
          Request Pickup
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Request a pickup</DialogTitle>
            <DialogDescription>
              Tell us where to collect from and when. We will assign a rider and
              confirm.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="pickup_address">Pickup address</Label>
              <Textarea
                id="pickup_address"
                rows={3}
                placeholder="Building, street, city"
                {...form.register("pickup_address")}
              />
              <FieldError message={form.formState.errors.pickup_address?.message} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contact_phone">Contact phone</Label>
              <Input
                id="contact_phone"
                inputMode="tel"
                placeholder="07XXXXXXXX"
                {...form.register("contact_phone")}
              />
              <FieldError message={form.formState.errors.contact_phone?.message} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="requested_date">Requested date</Label>
              <Input
                id="requested_date"
                type="date"
                min={today()}
                {...form.register("requested_date")}
              />
              <FieldError message={form.formState.errors.requested_date?.message} />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Create request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}
