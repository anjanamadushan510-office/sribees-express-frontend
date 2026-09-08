"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useUpdateAccount } from "@/lib/hooks/use-profile";
import { getErrorMessage } from "@/lib/api/client";
import type { ClientProfile } from "@/types/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  delivery_email: z.string().email("Enter a valid email"),
  financial_email: z.string().email("Enter a valid email"),
  way_bill_auto_generate: z.enum(["Manual", "Auto"]),
  ai_status: z.enum(["enabled", "disabled"]),
});
type FormValues = z.infer<typeof schema>;

export function AccountSettingsForm({ profile }: { profile: ClientProfile }) {
  const mutation = useUpdateAccount();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      delivery_email: profile.delivery_email ?? "",
      financial_email: profile.financial_email ?? "",
      way_bill_auto_generate:
        profile.way_bill_auto_generate === "Manual" ? "Manual" : "Auto",
      ai_status: profile.ai_status === "enabled" ? "enabled" : "disabled",
    },
  });

  const onSubmit = (values: FormValues) => {
    mutation.mutate(values, {
      onSuccess: () => toast.success("Account settings updated"),
      onError: (e) => toast.error(getErrorMessage(e, "Could not update account")),
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-lg space-y-4">
      <div className="space-y-1.5">
        <Label>Delivery email</Label>
        <Input type="email" {...form.register("delivery_email")} />
        {form.formState.errors.delivery_email && (
          <p className="text-sm text-destructive">
            {form.formState.errors.delivery_email.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Financial email</Label>
        <Input type="email" {...form.register("financial_email")} />
        {form.formState.errors.financial_email && (
          <p className="text-sm text-destructive">
            {form.formState.errors.financial_email.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Waybill generation</Label>
        <Select
          value={form.watch("way_bill_auto_generate")}
          onValueChange={(v) =>
            form.setValue("way_bill_auto_generate", v as "Manual" | "Auto")
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Auto">Auto-generate</SelectItem>
            <SelectItem value="Manual">Manual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>AI delivery progress</Label>
        <Select
          value={form.watch("ai_status")}
          onValueChange={(v) => form.setValue("ai_status", v as "enabled" | "disabled")}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="enabled">Enabled</SelectItem>
            <SelectItem value="disabled">Disabled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
        Save changes
      </Button>
    </form>
  );
}
