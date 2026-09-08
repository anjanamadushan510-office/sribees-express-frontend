"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/providers/auth-provider";
import { useAdminClientRow, useToggleClientStatus } from "@/lib/hooks/use-admin-clients";
import { getErrorMessage } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/shared/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClientSettingsTab } from "@/components/admin/client-settings-tab";
import { ClientFinanceTab } from "@/components/admin/client-finance-tab";
import { ClientTaxTab } from "@/components/admin/client-tax-tab";
import { ClientMarketingTab } from "@/components/admin/client-marketing-tab";
import { ClientApiTab } from "@/components/admin/client-api-tab";

export default function AdminClientDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const clientId = Number(id);
  const { hasPermission } = useAuth();

  const { data: client, isLoading, isError } = useAdminClientRow(id);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  return (
    <div className="mx-auto max-w-5xl">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href="/admin/clients">
          <ArrowLeft className="size-4" />
          Back to clients
        </Link>
      </Button>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : isError || !client ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Couldn&apos;t load this client. It may not exist, or you may not have
            permission to view it.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{client.client_name}</h1>
              <p className="text-sm text-muted-foreground">{client.client_number}</p>
            </div>
            <div className="flex items-center gap-2">
              {client.status && <StatusBadge status={client.status} />}
              {(hasPermission("activate-client") || hasPermission("deactivate-client")) && (
                <Button size="sm" variant="outline" onClick={() => setStatusDialogOpen(true)}>
                  {client.status === "active" ? "Deactivate" : "Activate"}
                </Button>
              )}
            </div>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <Detail label="Email">{client.email ?? "—"}</Detail>
                <Detail label="Financial email">{client.financial_email ?? "—"}</Detail>
                <Detail label="Address">{client.address ?? "—"}</Detail>
                <Detail label="Pickup branch">{client.pickup_branch ?? "—"}</Detail>
                <Detail label="Pickup address">{client.pick_address ?? "—"}</Detail>
                <Detail label="Nearest city">{client.nearest_city ?? "—"}</Detail>
                <Detail label="Owner">{client.owner_name ?? "—"}</Detail>
                <Detail label="Owner NIC">{client.owner_nic ?? "—"}</Detail>
                <Detail label="Advisor">{client.advisor_name ?? "—"}</Detail>
                <Detail label="Bank">{client.bank_name ?? "—"}</Detail>
                <Detail label="Account holder">{client.account_holder_name ?? "—"}</Detail>
                <Detail label="Account number">{client.bank_account_number ?? "—"}</Detail>
                <Detail label="Business reg. no.">{client.business_reg_no ?? "—"}</Detail>
                <Detail label="Payment terms">{client.payment_terms ?? "—"}</Detail>
                {client.remark && (
                  <Detail label="Status remark" className="sm:col-span-2 lg:col-span-3">
                    {client.remark}
                  </Detail>
                )}
              </dl>
            </CardContent>
          </Card>

          <Tabs defaultValue="settings">
            <TabsList>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="finance">Finance</TabsTrigger>
              <TabsTrigger value="tax">Tax</TabsTrigger>
              <TabsTrigger value="marketing">Marketing</TabsTrigger>
              <TabsTrigger value="api">API</TabsTrigger>
            </TabsList>
            <TabsContent value="settings">
              <ClientSettingsTab clientId={clientId} />
            </TabsContent>
            <TabsContent value="finance">
              <ClientFinanceTab clientId={clientId} />
            </TabsContent>
            <TabsContent value="tax">
              <ClientTaxTab clientId={clientId} />
            </TabsContent>
            <TabsContent value="marketing">
              <ClientMarketingTab clientId={clientId} />
            </TabsContent>
            <TabsContent value="api">
              <ClientApiTab clientId={clientId} />
            </TabsContent>
          </Tabs>

          <ToggleStatusDialog
            open={statusDialogOpen}
            onOpenChange={setStatusDialogOpen}
            clientId={clientId}
            isActive={client.status === "active"}
          />
        </>
      )}
    </div>
  );
}

function Detail({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}

function ToggleStatusDialog({
  open,
  onOpenChange,
  clientId,
  isActive,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: number;
  isActive: boolean;
}) {
  const [remark, setRemark] = useState("");
  const mutation = useToggleClientStatus();

  const submit = () => {
    mutation.mutate(
      { id: clientId, isActive: !isActive, remark: remark.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(isActive ? "Client deactivated" : "Client activated");
          setRemark("");
          onOpenChange(false);
        },
        onError: (error) => toast.error(getErrorMessage(error, "Could not update status")),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isActive ? "Deactivate" : "Activate"} client</DialogTitle>
        </DialogHeader>
        <Textarea
          placeholder="Remark (optional)…"
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          rows={3}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={mutation.isPending} onClick={submit}>
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
