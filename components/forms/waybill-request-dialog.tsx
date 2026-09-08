"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import { toast } from "sonner";
import { Loader2, Wand2 } from "lucide-react";
import { useAdminClientsDropdown } from "@/lib/hooks/use-admin-orders";
import { useCreateWaybillRequest } from "@/lib/hooks/use-admin-waybills";
import { getNextAvailableWaybillStart } from "@/lib/api/admin-waybills";
import { getErrorMessage } from "@/lib/api/client";
import type { CreateWaybillRequestPayload } from "@/types/admin-waybill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Combobox } from "@/components/shared/combobox";

const WAYBILL_RE = /^[A-Z][0-9]{7}$/;

const schema = z.object({
  client_id: z.string().min(1, "Select a client"),
  quantity: z.coerce.number().int().min(1, "Must be at least 1"),
  barcode_quantity: z.coerce.number().int().min(1, "Must be at least 1"),
  from: z.string().regex(WAYBILL_RE, "Format: A0000001"),
  to: z.string().regex(WAYBILL_RE, "Format: A0000001"),
});

type FormValues = z.input<typeof schema>;

export function WaybillRequestDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: clients, isLoading: clientsLoading } = useAdminClientsDropdown();
  const mutation = useCreateWaybillRequest();
  const [suggestLoading, setSuggestLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { client_id: "", quantity: 100, barcode_quantity: 100, from: "", to: "" },
  });

  const clientOptions = useMemo(
    () => (clients ?? []).map((c) => ({ value: String(c.key), label: c.value })),
    [clients]
  );

  const onSubmit = (values: FormValues) => {
    const payload: CreateWaybillRequestPayload = {
      client_id: Number(values.client_id),
      quantity: Number(values.quantity),
      barcode_quantity: Number(values.barcode_quantity),
      from: values.from,
      to: values.to,
    };

    mutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Waybill request created");
        form.reset();
        onOpenChange(false);
      },
      onError: (error) => {
        if (axios.isAxiosError(error) && error.response?.status === 422) {
          const fieldErrors = (error.response.data?.error ?? {}) as Record<
            string,
            string[]
          >;
          let mapped = false;
          for (const [field, messages] of Object.entries(fieldErrors)) {
            if (field in (form.getValues() as object)) {
              form.setError(field as keyof FormValues, { message: messages[0] });
              mapped = true;
            }
          }
          if (mapped) {
            toast.error("Please fix the highlighted fields");
            return;
          }
        }
        toast.error(getErrorMessage(error, "Could not create waybill request"));
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New waybill request</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <Field label="Client" error={form.formState.errors.client_id?.message}>
            <Combobox
              options={clientOptions}
              value={form.watch("client_id")}
              onChange={(v) => form.setValue("client_id", v, { shouldValidate: true })}
              placeholder={clientsLoading ? "Loading…" : "Select client"}
              searchPlaceholder="Search client…"
              emptyMessage="No client found."
              disabled={clientsLoading}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Waybill quantity" error={form.formState.errors.quantity?.message}>
              <Input type="number" {...form.register("quantity")} />
            </Field>
            <Field
              label="Barcode quantity"
              error={form.formState.errors.barcode_quantity?.message}
            >
              <Input type="number" {...form.register("barcode_quantity")} />
            </Field>
          </div>
          <Field label="From" error={form.formState.errors.from?.message}>
            <div className="flex gap-2">
              <Input {...form.register("from")} placeholder="A0000001" className="flex-1" />
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={suggestLoading}
                title="Suggest next available start"
                onClick={async () => {
                  setSuggestLoading(true);
                  try {
                    const next = await getNextAvailableWaybillStart();
                    if (next) form.setValue("from", next, { shouldValidate: true });
                    else toast.error("No suggestion available");
                  } catch (error) {
                    toast.error(getErrorMessage(error, "Could not fetch a suggestion"));
                  } finally {
                    setSuggestLoading(false);
                  }
                }}
              >
                {suggestLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Wand2 className="size-4" />
                )}
              </Button>
            </div>
          </Field>
          <Field label="To" error={form.formState.errors.to?.message}>
            <Input {...form.register("to")} placeholder="A0000100" />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}
