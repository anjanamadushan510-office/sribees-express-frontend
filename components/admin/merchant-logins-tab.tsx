"use client";

import { useState } from "react";
import { KeyRound, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateMerchantLogin,
  useMerchantLogins,
  useSetMerchantLoginPassword,
  useUpdateMerchantLogin,
} from "@/lib/hooks/use-identity";
import type { MerchantLogin } from "@/types/identity";
import { getErrorMessage } from "@/lib/api/client";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

/** The people at the merchant who sign in to the customer portal. */
export function MerchantLoginsTab({ clientId }: { clientId: number }) {
  const { data: logins, isFetching, isError, error } = useMerchantLogins(clientId);
  const [adding, setAdding] = useState(false);
  const [resetting, setResetting] = useState<MerchantLogin | null>(null);
  const update = useUpdateMerchantLogin(clientId);

  async function setActive(login: MerchantLogin, isActive: boolean) {
    try {
      await update.mutateAsync({ id: login.id, payload: { is_active: isActive } });
      toast.success(isActive ? "Login enabled" : "Login disabled");
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not change the login"));
    }
  }

  const columns: Column<MerchantLogin>[] = [
    { header: "Name", cell: (r) => <span className="font-medium">{r.name}</span> },
    { header: "Email", cell: (r) => r.email },
    {
      header: "Status",
      cell: (r) => <StatusBadge status={r.is_active ? "Active" : "Disabled"} />,
    },
    {
      header: "",
      className: "text-right",
      cell: (r) => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setResetting(r)}>
            <KeyRound className="mr-2 h-4 w-4" />
            Password
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActive(r, !r.is_active)}
            disabled={update.isPending}
          >
            {r.is_active ? "Disable" : "Enable"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Portal logins</CardTitle>
          <Button onClick={() => setAdding(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add login
          </Button>
        </CardHeader>
        <CardContent>
          {isError && (
            <p className="mb-4 text-sm text-destructive">
              {error instanceof Error ? error.message : "Could not load logins."}
            </p>
          )}
          <DataTable
            columns={columns}
            rows={logins}
            isLoading={isFetching && !logins}
            rowKey={(r) => r.id}
            emptyMessage="This merchant has no logins."
          />
        </CardContent>
      </Card>

      <AddLoginDialog clientId={clientId} open={adding} onOpenChange={setAdding} />
      <ResetPasswordDialog login={resetting} onClose={() => setResetting(null)} />
    </>
  );
}

function AddLoginDialog({
  clientId,
  open,
  onOpenChange,
}: {
  clientId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const create = useCreateMerchantLogin();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await create.mutateAsync({ clientId, payload: form });
      toast.success("Login created");
      setForm({ name: "", email: "", password: "" });
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not create the login"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Add a portal login</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="login_name">Name</Label>
              <Input
                id="login_name"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="login_email">Email</Label>
              <Input
                id="login_email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="login_password">Password</Label>
              <Input
                id="login_password"
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={create.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Creating…" : "Create login"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({
  login,
  onClose,
}: {
  login: MerchantLogin | null;
  onClose: () => void;
}) {
  const [password, setPassword] = useState("");
  const setLoginPassword = useSetMerchantLoginPassword();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!login) return;
    try {
      await setLoginPassword.mutateAsync({ id: login.id, password });
      toast.success(`Password set for ${login.email}`);
      setPassword("");
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not set the password"));
    }
  }

  return (
    <Dialog
      open={login !== null}
      onOpenChange={(open) => {
        if (!open) {
          setPassword("");
          onClose();
        }
      }}
    >
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Set a new password</DialogTitle>
            <DialogDescription>
              {login?.email} is signed out everywhere as soon as this is saved.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <Label htmlFor="new_password">New password</Label>
            <Input
              id="new_password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={setLoginPassword.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={setLoginPassword.isPending}>
              {setLoginPassword.isPending ? "Saving…" : "Set password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
