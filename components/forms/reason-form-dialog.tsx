"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  useCreateReason,
  useReason,
  useReasonTypesDropdown,
  useUpdateReason,
} from "@/lib/hooks/use-admin-reasons";
import { getErrorMessage } from "@/lib/api/client";
import type { SaveReasonPayload } from "@/types/admin-reason";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  reason_type_id: z.string().min(1, "Select a type"),
  reason: z.string().trim().min(2, "At least 2 characters").max(255),
  remarks: z.string().trim().max(255).optional(),
});

type FormValues = z.infer<typeof schema>;

export function ReasonFormDialog({
  open,
  onOpenChange,
  reasonId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = create mode. */
  reasonId: number | null;
}) {
  const isEdit = reasonId !== null;
  const { data: reasonTypes, isLoading: typesLoading } = useReasonTypesDropdown();
  const { data: reason, isLoading: reasonLoading } = useReason(isEdit ? reasonId : null);
  const createMutation = useCreateReason();
  const updateMutation = useUpdateReason(reasonId ?? 0);
  const mutation = isEdit ? updateMutation : createMutation;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { reason_type_id: "", reason: "", remarks: "" },
  });

  useEffect(() => {
    if (open && isEdit && reason) {
      form.reset({
        reason_type_id: String(reason.reason_type_id),
        reason: reason.reason,
        remarks: reason.remarks ?? "",
      });
    } else if (open && !isEdit) {
      form.reset({ reason_type_id: "", reason: "", remarks: "" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, reason]);

  const onSubmit = (values: FormValues) => {
    const payload: SaveReasonPayload = {
      reason_type_id: Number(values.reason_type_id),
      reason: values.reason,
      remarks: values.remarks || undefined,
    };

    mutation.mutate(payload, {
      onSuccess: () => {
        toast.success(isEdit ? "Reason updated" : "Reason created");
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
        toast.error(getErrorMessage(error, "Could not save the reason"));
      },
    });
  };

  const typeOptions = useMemo(() => reasonTypes ?? [], [reasonTypes]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit reason" : "New reason"}</DialogTitle>
        </DialogHeader>

        {isEdit && reasonLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <Field label="Type" error={form.formState.errors.reason_type_id?.message}>
              <Select
                value={form.watch("reason_type_id")}
                onValueChange={(v) =>
                  form.setValue("reason_type_id", v, { shouldValidate: true })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={typesLoading ? "Loading…" : "Select type"} />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((t) => (
                    <SelectItem key={t.key} value={String(t.key)}>
                      {t.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Reason" error={form.formState.errors.reason?.message}>
              <Input {...form.register("reason")} placeholder="Customer not reachable" />
            </Field>
            <Field label="Remarks (optional)" error={form.formState.errors.remarks?.message}>
              <Input {...form.register("remarks")} placeholder="Additional notes" />
            </Field>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
                {isEdit ? "Save changes" : "Create reason"}
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
