"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAdminCities } from "@/lib/hooks/use-admin-orders";
import { useCreateZone, useUpdateZone, useZone } from "@/lib/hooks/use-admin-locations";
import { getErrorMessage } from "@/lib/api/client";
import type { SaveZonePayload, ZoneDetail } from "@/types/admin-location";
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
import { MultiSelect } from "@/components/shared/multi-select";

const schema = z.object({
  name: z.string().trim().min(1, "Zone name is required").max(255),
  city_ids: z.array(z.string()).min(1, "Select at least one city"),
  first_kg: z.coerce.number().min(0, "Must be 0 or more"),
  after_kg: z.coerce.number().min(0, "Must be 0 or more"),
  return_first_kg: z.coerce.number().min(0, "Must be 0 or more"),
  return_after_kg: z.coerce.number().min(0, "Must be 0 or more"),
  delivery_weight_margin: z.coerce.number().min(0, "Must be 0 or more"),
});

type FormValues = z.input<typeof schema>;

export function ZoneFormDialog({
  open,
  onOpenChange,
  zoneId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = create mode. */
  zoneId: number | null;
}) {
  const isEdit = zoneId !== null;
  const { data: zone, isLoading: zoneLoading } = useZone(isEdit ? zoneId : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit zone" : "New zone"}</DialogTitle>
        </DialogHeader>

        {isEdit && zoneLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : isEdit && !zone ? (
          <p className="text-sm text-muted-foreground">Could not load this zone.</p>
        ) : (
          <ZoneForm
            key={zoneId ?? "new"}
            zoneId={zoneId}
            zone={zone ?? null}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ZoneForm({
  zoneId,
  zone,
  onDone,
}: {
  zoneId: number | null;
  zone: ZoneDetail | null;
  onDone: () => void;
}) {
  const isEdit = zoneId !== null;
  const { data: cities, isLoading: citiesLoading } = useAdminCities();
  const createMutation = useCreateZone();
  const updateMutation = useUpdateZone(zoneId ?? 0);
  const mutation = isEdit ? updateMutation : createMutation;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: zone?.name ?? "",
      city_ids: zone?.cities?.map((c) => String(c.id)) ?? [],
      first_kg: zone?.first_kg ?? 0,
      after_kg: zone?.after_kg ?? 0,
      return_first_kg: zone?.return_first_kg ?? 0,
      return_after_kg: zone?.return_after_kg ?? 0,
      delivery_weight_margin: zone?.delivery_weight_margin ?? 0,
    },
  });

  const cityOptions = useMemo(
    () => (cities ?? []).map((c) => ({ value: String(c.key), label: c.value })),
    [cities]
  );

  const onSubmit = (values: FormValues) => {
    const payload: SaveZonePayload = {
      name: values.name!,
      city_ids: values.city_ids!.map(Number),
      first_kg: Number(values.first_kg),
      after_kg: Number(values.after_kg),
      return_first_kg: Number(values.return_first_kg),
      return_after_kg: Number(values.return_after_kg),
      delivery_weight_margin: Number(values.delivery_weight_margin),
    };

    mutation.mutate(payload, {
      onSuccess: () => {
        toast.success(isEdit ? "Zone updated" : "Zone created");
        onDone();
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
        toast.error(getErrorMessage(error, "Could not save zone"));
      },
    });
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="max-h-[70vh] space-y-3 overflow-y-auto pr-1"
    >
      <Field label="Zone name" error={form.formState.errors.name?.message}>
        <Input {...form.register("name")} placeholder="Zone A" />
      </Field>
      <Field label="Cities" error={form.formState.errors.city_ids?.message}>
        <MultiSelect
          options={cityOptions}
          value={form.watch("city_ids") ?? []}
          onChange={(v) => form.setValue("city_ids", v, { shouldValidate: true })}
          placeholder={citiesLoading ? "Loading…" : "Select cities"}
          searchPlaceholder="Search city…"
          emptyMessage="No city found."
          disabled={citiesLoading}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="1st KG" error={form.formState.errors.first_kg?.message}>
          <Input type="number" step="0.01" {...form.register("first_kg")} />
        </Field>
        <Field label="After KG" error={form.formState.errors.after_kg?.message}>
          <Input type="number" step="0.01" {...form.register("after_kg")} />
        </Field>
        <Field label="Return 1st KG" error={form.formState.errors.return_first_kg?.message}>
          <Input type="number" step="0.01" {...form.register("return_first_kg")} />
        </Field>
        <Field
          label="Return after KG"
          error={form.formState.errors.return_after_kg?.message}
        >
          <Input type="number" step="0.01" {...form.register("return_after_kg")} />
        </Field>
      </div>
      <Field
        label="Weight margin"
        error={form.formState.errors.delivery_weight_margin?.message}
      >
        <Input type="number" step="0.01" {...form.register("delivery_weight_margin")} />
      </Field>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
          {isEdit ? "Save changes" : "Create zone"}
        </Button>
      </DialogFooter>
    </form>
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
