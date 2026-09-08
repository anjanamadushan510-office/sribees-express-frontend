"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Truck } from "lucide-react";
import { useCreatePickup, usePickupVehicleTypes } from "@/lib/hooks/use-pickups";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  vehicle_type_id: z.string().min(1, "Select a vehicle type"),
  order_count: z.coerce
    .number({ message: "Enter the number of orders" })
    .int("Must be a whole number")
    .min(1, "At least 1 order"),
  note: z.union([z.string().trim().min(2, "Note is too short"), z.literal("")]).optional(),
});
type FormValues = z.input<typeof schema>;

export function CreatePickupDialog() {
  const [open, setOpen] = useState(false);
  const { data: vehicleTypes } = usePickupVehicleTypes();
  const mutation = useCreatePickup();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { vehicle_type_id: "", order_count: undefined, note: "" },
  });

  const onSubmit = (values: FormValues) => {
    mutation.mutate(
      {
        vehicle_type_id: Number(values.vehicle_type_id),
        order_count: Number(values.order_count),
        note: values.note || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Pickup request created");
          form.reset();
          setOpen(false);
        },
        onError: (e) => toast.error(getErrorMessage(e, "Could not create pickup request")),
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
            <DialogTitle>Request a Pickup</DialogTitle>
            <DialogDescription>
              A rider will be assigned to collect your parcels.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>Vehicle type</Label>
              <Select
                value={form.watch("vehicle_type_id")}
                onValueChange={(v) =>
                  form.setValue("vehicle_type_id", v, { shouldValidate: true })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  {vehicleTypes?.map((v) => (
                    <SelectItem key={v.key} value={v.key}>
                      {v.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.vehicle_type_id && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.vehicle_type_id.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Number of orders</Label>
              <Input type="number" min={1} {...form.register("order_count")} placeholder="e.g. 10" />
              {form.formState.errors.order_count && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.order_count.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Note (optional)</Label>
              <Textarea {...form.register("note")} rows={2} placeholder="Pickup instructions" />
              {form.formState.errors.note && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.note.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Submit Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
