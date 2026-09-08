"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAdminBranches, useAdminClientsDropdown } from "@/lib/hooks/use-admin-orders";
import {
  useCreateStaffMember,
  useRolesDropdown,
  useStaffMember,
  useUpdateStaffMember,
} from "@/lib/hooks/use-admin-staff";
import { getErrorMessage } from "@/lib/api/client";
import type { SaveStaffPayload, StaffDetail } from "@/types/admin-staff";
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
import { MultiSelect } from "@/components/shared/multi-select";

function buildSchema(isEdit: boolean) {
  return z
    .object({
      name: z.string().trim().min(2, "At least 2 characters").max(255),
      nic: z.string().trim().min(10, "NIC is required").max(12),
      address: z.string().trim().min(2, "Address is required").max(255),
      email: z.string().trim().email("Enter a valid email").max(55),
      contact_no: z
        .string()
        .regex(/^[0-9]{9,12}$/, "Enter a valid phone number (9–12 digits)"),
      role_id: z.string().min(1, "Select a role"),
      branch_ids: z.array(z.string()).min(1, "Select at least one branch"),
      client_ids: z.array(z.string()).optional(),
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

export function StaffFormDialog({
  open,
  onOpenChange,
  staffId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = create mode. */
  staffId: number | null;
}) {
  const isEdit = staffId !== null;
  const { data: staff, isLoading: staffLoading } = useStaffMember(isEdit ? staffId : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit staff member" : "New staff member"}</DialogTitle>
        </DialogHeader>

        {isEdit && staffLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : isEdit && !staff ? (
          <p className="text-sm text-muted-foreground">Could not load this staff member.</p>
        ) : (
          <StaffForm
            key={staffId ?? "new"}
            staffId={staffId}
            staff={staff ?? null}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function StaffForm({
  staffId,
  staff,
  onDone,
}: {
  staffId: number | null;
  staff: StaffDetail | null;
  onDone: () => void;
}) {
  const isEdit = staffId !== null;
  const schema = useMemo(() => buildSchema(isEdit), [isEdit]);
  const { data: roles, isLoading: rolesLoading } = useRolesDropdown();
  const { data: branches, isLoading: branchesLoading } = useAdminBranches();
  const { data: clients, isLoading: clientsLoading } = useAdminClientsDropdown();
  const createMutation = useCreateStaffMember();
  const updateMutation = useUpdateStaffMember(staffId ?? 0);
  const mutation = isEdit ? updateMutation : createMutation;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: staff?.name ?? "",
      nic: staff?.nic ?? "",
      address: staff?.address ?? "",
      email: staff?.email ?? "",
      contact_no: staff?.contact_no ?? "",
      role_id: staff?.roles[0] ? String(staff.roles[0].id) : "",
      branch_ids: staff?.branch.map((b) => String(b.branch_id)) ?? [],
      client_ids: staff?.clients.map((c) => String(c.client_id)) ?? [],
      password: "",
      password_confirmation: "",
    },
  });

  const roleOptions = useMemo(
    () => (roles ?? []).map((r) => ({ value: String(r.key), label: r.value })),
    [roles]
  );
  const branchOptions = useMemo(
    () => (branches ?? []).map((b) => ({ value: String(b.key), label: b.value })),
    [branches]
  );
  const clientOptions = useMemo(
    () => (clients ?? []).map((c) => ({ value: String(c.key), label: c.value })),
    [clients]
  );

  const onSubmit = (values: FormValues) => {
    const payload: SaveStaffPayload = {
      name: values.name,
      nic: values.nic,
      address: values.address,
      email: values.email,
      contact_no: values.contact_no,
      role_id: Number(values.role_id),
      branch_ids: values.branch_ids.map(Number),
      client_ids: (values.client_ids ?? []).map(Number),
      ...(values.password
        ? { password: values.password, password_confirmation: values.password_confirmation }
        : {}),
    };

    mutation.mutate(payload, {
      onSuccess: () => {
        toast.success(isEdit ? "Staff member updated" : "Staff member created");
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
        toast.error(getErrorMessage(error, "Could not save staff member"));
      },
    });
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="max-h-[70vh] space-y-3 overflow-y-auto pr-1"
    >
      <Field label="Full name" error={form.formState.errors.name?.message}>
        <Input {...form.register("name")} placeholder="Kamal Silva" />
      </Field>
      <Field label="NIC" error={form.formState.errors.nic?.message}>
        <Input {...form.register("nic")} placeholder="991234567V" />
      </Field>
      <Field label="Address" error={form.formState.errors.address?.message}>
        <Input {...form.register("address")} placeholder="Home address" />
      </Field>
      <Field label="Contact number" error={form.formState.errors.contact_no?.message}>
        <Input {...form.register("contact_no")} placeholder="0771234567" inputMode="numeric" />
      </Field>
      <Field label="Email" error={form.formState.errors.email?.message}>
        <Input {...form.register("email")} type="email" placeholder="staff@example.com" />
      </Field>
      <Field label="Role" error={form.formState.errors.role_id?.message}>
        <Combobox
          options={roleOptions}
          value={form.watch("role_id")}
          onChange={(v) => form.setValue("role_id", v, { shouldValidate: true })}
          placeholder={rolesLoading ? "Loading…" : "Select role"}
          searchPlaceholder="Search role…"
          emptyMessage="No role found."
          disabled={rolesLoading}
        />
      </Field>
      <Field label="Branches" error={form.formState.errors.branch_ids?.message}>
        <MultiSelect
          options={branchOptions}
          value={form.watch("branch_ids")}
          onChange={(v) => form.setValue("branch_ids", v, { shouldValidate: true })}
          placeholder={branchesLoading ? "Loading…" : "Select branches"}
          searchPlaceholder="Search branch…"
          emptyMessage="No branch found."
          disabled={branchesLoading}
        />
      </Field>
      <Field label="Clients (optional)">
        <MultiSelect
          options={clientOptions}
          value={form.watch("client_ids") ?? []}
          onChange={(v) => form.setValue("client_ids", v)}
          placeholder={clientsLoading ? "Loading…" : "Select clients"}
          searchPlaceholder="Search client…"
          emptyMessage="No client found."
          disabled={clientsLoading}
        />
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
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
          {isEdit ? "Save changes" : "Create staff member"}
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
