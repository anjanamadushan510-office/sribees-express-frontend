"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAdminBranches } from "@/lib/hooks/use-admin-orders";
import { useCreateRider, useRider, useUpdateRider } from "@/lib/hooks/use-admin-riders";
import { getErrorMessage } from "@/lib/api/client";
import type { SaveRiderPayload } from "@/types/admin-rider";
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

function buildSchema(isEdit: boolean) {
  return z
    .object({
      name: z.string().trim().min(1, "Name is required").max(190),
      nic: z.string().trim().min(10, "NIC is required").max(12),
      address: z.string().trim().min(1, "Address is required").max(190),
      contact_no: z
        .string()
        .regex(/^[0-9]{9,12}$/, "Enter a valid phone number (9–12 digits)"),
      email: z.string().trim().email("Enter a valid email").max(55),
      branch_id: z.string().min(1, "Select a branch"),
      contract_type: z.enum(["staff", "freelance"]),
      password: isEdit
        ? z.union([z.string().min(8, "At least 8 characters"), z.literal("")]).optional()
        : z.string().min(8, "At least 8 characters"),
      password_confirmation: z.string().optional(),
    })
    .refine((v) => !v.password || v.password === v.password_confirmation, {
      message: "Passwords do not match",
      path: ["password_confirmation"],
    });
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

export function RiderFormDialog({
  open,
  onOpenChange,
  riderId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = create mode. */
  riderId: number | null;
}) {
  const isEdit = riderId !== null;
  const schema = useMemo(() => buildSchema(isEdit), [isEdit]);
  const { data: branches, isLoading: branchesLoading } = useAdminBranches();
  const { data: rider, isLoading: riderLoading } = useRider(isEdit ? riderId : null);
  const createMutation = useCreateRider();
  const updateMutation = useUpdateRider(riderId ?? 0);
  const mutation = isEdit ? updateMutation : createMutation;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      nic: "",
      address: "",
      contact_no: "",
      email: "",
      branch_id: "",
      contract_type: "staff",
      password: "",
      password_confirmation: "",
    },
  });

  useEffect(() => {
    if (open && isEdit && rider) {
      form.reset({
        name: rider.name,
        nic: rider.nic,
        address: rider.address,
        contact_no: rider.contact_no,
        email: rider.email,
        branch_id: String(rider.branch[0]?.branch_id ?? ""),
        contract_type: rider.contract_type,
        password: "",
        password_confirmation: "",
      });
    } else if (open && !isEdit) {
      form.reset({
        name: "",
        nic: "",
        address: "",
        contact_no: "",
        email: "",
        branch_id: "",
        contract_type: "staff",
        password: "",
        password_confirmation: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, rider]);

  const onSubmit = (values: FormValues) => {
    const payload: SaveRiderPayload = {
      name: values.name,
      nic: values.nic,
      address: values.address,
      contact_no: values.contact_no,
      email: values.email,
      branch_id: Number(values.branch_id),
      contract_type: values.contract_type,
      ...(values.password
        ? { password: values.password, password_confirmation: values.password_confirmation }
        : {}),
    };

    mutation.mutate(payload, {
      onSuccess: () => {
        toast.success(isEdit ? "Rider updated" : "Rider created");
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
        toast.error(getErrorMessage(error, "Could not save the rider"));
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit rider" : "New rider"}</DialogTitle>
        </DialogHeader>

        {isEdit && riderLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="max-h-[70vh] space-y-3 overflow-y-auto pr-1"
          >
            <Field label="Full name" error={form.formState.errors.name?.message}>
              <Input {...form.register("name")} placeholder="Nimal Perera" />
            </Field>
            <Field label="NIC" error={form.formState.errors.nic?.message}>
              <Input {...form.register("nic")} placeholder="991234567V" />
            </Field>
            <Field label="Address" error={form.formState.errors.address?.message}>
              <Input {...form.register("address")} placeholder="Home address" />
            </Field>
            <Field label="Contact number" error={form.formState.errors.contact_no?.message}>
              <Input
                {...form.register("contact_no")}
                placeholder="0771234567"
                inputMode="numeric"
              />
            </Field>
            <Field label="Email" error={form.formState.errors.email?.message}>
              <Input {...form.register("email")} type="email" placeholder="rider@example.com" />
            </Field>
            <Field label="Branch" error={form.formState.errors.branch_id?.message}>
              <Select
                value={form.watch("branch_id")}
                onValueChange={(v) => form.setValue("branch_id", v, { shouldValidate: true })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={branchesLoading ? "Loading…" : "Select branch"} />
                </SelectTrigger>
                <SelectContent>
                  {branches?.map((b) => (
                    <SelectItem key={b.key} value={String(b.key)}>
                      {b.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field
              label="Contract type"
              error={form.formState.errors.contract_type?.message}
            >
              <Select
                value={form.watch("contract_type")}
                onValueChange={(v) =>
                  form.setValue("contract_type", v as "staff" | "freelance", {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="freelance">Freelance</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field
              label={isEdit ? "New password (optional)" : "Password"}
              error={form.formState.errors.password?.message}
            >
              <Input {...form.register("password")} type="password" placeholder="••••••••" />
            </Field>
            <Field
              label="Confirm password"
              error={form.formState.errors.password_confirmation?.message}
            >
              <Input
                {...form.register("password_confirmation")}
                type="password"
                placeholder="••••••••"
              />
            </Field>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
                {isEdit ? "Save changes" : "Create rider"}
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
