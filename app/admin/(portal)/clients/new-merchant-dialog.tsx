"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useCreateMerchant } from "@/lib/hooks/use-identity";
import { getErrorMessage } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (clientId: number) => void;
}

const EMPTY = {
  business_name: "",
  email: "",
  phone: "",
  commission_percent: "0.00",
  admin_name: "",
  admin_email: "",
  admin_password: "",
};

/**
 * The business and its first login are one form because the API creates them in
 * one transaction — a merchant with no login cannot sign in, and a two-step
 * flow leaves one behind every time someone is interrupted.
 */
export function NewMerchantDialog({ open, onOpenChange, onCreated }: Props) {
  const [form, setForm] = useState(EMPTY);
  const createMerchant = useCreateMerchant();

  function set(field: keyof typeof EMPTY, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      const result = await createMerchant.mutateAsync({
        business_name: form.business_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        commission_percent: form.commission_percent || "0.00",
        admin_name: form.admin_name.trim(),
        admin_email: form.admin_email.trim(),
        admin_password: form.admin_password,
      });
      toast.success(`${result.client.business_name} created`);
      setForm(EMPTY);
      onOpenChange(false);
      onCreated(result.client.id);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not create the merchant"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>New merchant</DialogTitle>
            <DialogDescription>
              Creates the business and its first portal login together.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="business_name">Business name</Label>
              <Input
                id="business_name"
                required
                value={form.business_name}
                onChange={(e) => set("business_name", e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="email">Business email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="commission_percent">Commission %</Label>
              <Input
                id="commission_percent"
                inputMode="decimal"
                value={form.commission_percent}
                onChange={(e) => set("commission_percent", e.target.value)}
              />
            </div>

            <div className="mt-2 border-t pt-4">
              <p className="mb-3 text-sm font-medium">First portal login</p>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="admin_name">Contact name</Label>
                  <Input
                    id="admin_name"
                    required
                    value={form.admin_name}
                    onChange={(e) => set("admin_name", e.target.value)}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="admin_email">Login email</Label>
                    <Input
                      id="admin_email"
                      type="email"
                      required
                      value={form.admin_email}
                      onChange={(e) => set("admin_email", e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="admin_password">Password</Label>
                    <Input
                      id="admin_password"
                      type="password"
                      required
                      value={form.admin_password}
                      onChange={(e) => set("admin_password", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMerchant.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMerchant.isPending}>
              {createMerchant.isPending ? "Creating…" : "Create merchant"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
