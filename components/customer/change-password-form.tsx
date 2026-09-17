"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useUpdatePassword } from "@/lib/hooks/use-profile";
import { getErrorMessage } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Trim leading/trailing whitespace before length-checking or comparing, the
// same copy-paste-safety trim used at login — otherwise a stray trailing
// space here becomes part of the saved password and *that* has to be
// retyped exactly at every future login.
const trimmedPassword = (message: string) =>
  z
    .string()
    .transform((v) => v.trim())
    .pipe(z.string().min(8, message));

const schema = z
  .object({
    current_password: trimmedPassword("Minimum 8 characters"),
    password: trimmedPassword("Minimum 8 characters"),
    password_confirmation: trimmedPassword("Minimum 8 characters"),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  });
type FormValues = z.infer<typeof schema>;

export function ChangePasswordForm() {
  const mutation = useUpdatePassword();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      current_password: "",
      password: "",
      password_confirmation: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    mutation.mutate(values, {
      onSuccess: () => {
        toast.success("Password updated");
        form.reset();
      },
      onError: (e) => toast.error(getErrorMessage(e, "Could not update password")),
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-lg space-y-4">
      <div className="space-y-1.5">
        <Label>Current password</Label>
        <Input type="password" autoComplete="current-password" {...form.register("current_password")} />
        {form.formState.errors.current_password && (
          <p className="text-sm text-destructive">
            {form.formState.errors.current_password.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>New password</Label>
        <Input type="password" autoComplete="new-password" {...form.register("password")} />
        {form.formState.errors.password && (
          <p className="text-sm text-destructive">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Confirm new password</Label>
        <Input
          type="password"
          autoComplete="new-password"
          {...form.register("password_confirmation")}
        />
        {form.formState.errors.password_confirmation && (
          <p className="text-sm text-destructive">
            {form.formState.errors.password_confirmation.message}
          </p>
        )}
      </div>

      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
        Update password
      </Button>
    </form>
  );
}
