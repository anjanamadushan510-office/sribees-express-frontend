"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAdminCities } from "@/lib/hooks/use-admin-orders";
import { useBranch, useCreateBranch, useUpdateBranch } from "@/lib/hooks/use-admin-branches";
import { getErrorMessage } from "@/lib/api/client";
import type { SaveBranchPayload } from "@/types/admin-branch";
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
  name: z.string().trim().min(1, "Branch name is required").max(255),
  address: z.string().trim().min(1, "Address is required").max(255),
  phone_no: z
    .string()
    .regex(/^[0-9]{9,12}$/, "Enter a valid phone number (9–12 digits)"),
  city_ids: z.array(z.string()).min(1, "Select at least one city"),
});

type FormValues = z.infer<typeof schema>;

export function BranchFormDialog({
  open,
  onOpenChange,
  branchId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = create mode. */
  branchId: number | null;
}) {
  const isEdit = branchId !== null;
  const { data: cities, isLoading: citiesLoading } = useAdminCities();
  const { data: branch, isLoading: branchLoading } = useBranch(isEdit ? branchId : null);
  const createMutation = useCreateBranch();
  const updateMutation = useUpdateBranch(branchId ?? 0);
  const mutation = isEdit ? updateMutation : createMutation;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", address: "", phone_no: "", city_ids: [] },
  });

  useEffect(() => {
    if (open && isEdit && branch) {
      form.reset({
        name: branch.name,
        address: branch.address,
        phone_no: branch.phone_no,
        city_ids: branch.cities.map((c) => String(c.id)),
      });
    } else if (open && !isEdit) {
      form.reset({ name: "", address: "", phone_no: "", city_ids: [] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, branch]);

  const cityOptions = useMemo(
    () => (cities ?? []).map((c) => ({ value: String(c.key), label: c.value })),
    [cities]
  );

  const onSubmit = (values: FormValues) => {
    const payload: SaveBranchPayload = {
      name: values.name,
      address: values.address,
      phone_no: values.phone_no,
      city_ids: values.city_ids.map(Number),
    };

    mutation.mutate(payload, {
      onSuccess: () => {
        toast.success(isEdit ? "Branch updated" : "Branch created");
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
        toast.error(getErrorMessage(error, "Could not save the branch"));
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit branch" : "New branch"}</DialogTitle>
        </DialogHeader>

        {isEdit && branchLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <Field label="Branch name" error={form.formState.errors.name?.message}>
              <Input {...form.register("name")} placeholder="Colombo Main" />
            </Field>
            <Field label="Address" error={form.formState.errors.address?.message}>
              <Input {...form.register("address")} placeholder="123 Galle Road, Colombo 03" />
            </Field>
            <Field label="Phone number" error={form.formState.errors.phone_no?.message}>
              <Input
                {...form.register("phone_no")}
                placeholder="0112345678"
                inputMode="numeric"
              />
            </Field>
            <Field label="Serviced cities" error={form.formState.errors.city_ids?.message}>
              <MultiSelect
                options={cityOptions}
                value={form.watch("city_ids")}
                onChange={(v) => form.setValue("city_ids", v, { shouldValidate: true })}
                placeholder={citiesLoading ? "Loading cities…" : "Select cities"}
                searchPlaceholder="Search city…"
                emptyMessage="No city found."
                disabled={citiesLoading}
              />
            </Field>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
                {isEdit ? "Save changes" : "Create branch"}
              </Button>
            </DialogFooter>
          </form>
        )}
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
