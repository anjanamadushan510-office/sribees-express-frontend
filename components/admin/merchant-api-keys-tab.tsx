"use client";

import { useState } from "react";
import { Check, Copy, KeyRound, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import {
  useApiKeys,
  useIssueApiKey,
  useRevokeApiKey,
} from "@/lib/hooks/use-identity";
import type { ApiKey, ApiKeyCreated, ApiKeyEnvironment } from "@/types/identity";
import { getErrorMessage } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Issuing, listing and revoking a merchant's integration keys.
 *
 * The one thing this screen must get right: the secret exists exactly once, in
 * the response to the request that created it. The API stores only a hash, so
 * there is no "show key" button to add later and no way to recover it — the UI
 * has to say so plainly and make copying it the obvious next action.
 */
export function MerchantApiKeysTab({ clientId }: { clientId: number }) {
  const { data: keys, isFetching, isError, error } = useApiKeys(clientId);
  const [issuing, setIssuing] = useState(false);
  const [issued, setIssued] = useState<ApiKeyCreated | null>(null);
  const revoke = useRevokeApiKey(clientId);

  async function revokeKey(key: ApiKey) {
    try {
      await revoke.mutateAsync(key.id);
      toast.success(`${key.key_prefix}… revoked`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not revoke the key"));
    }
  }

  const columns: Column<ApiKey>[] = [
    {
      header: "Key",
      cell: (r) => <span className="font-mono text-sm">{r.key_prefix}…</span>,
    },
    {
      header: "Environment",
      cell: (r) => (
        <StatusBadge status={r.environment === "live" ? "Live" : "Sandbox"} />
      ),
    },
    {
      header: "Rate limit",
      className: "text-right",
      cell: (r) => `${r.rate_limit_per_minute}/min`,
    },
    { header: "Created", cell: (r) => formatDate(r.created_at) },
    {
      header: "Last used",
      cell: (r) =>
        r.last_used_at ? (
          formatDate(r.last_used_at)
        ) : (
          <span className="text-muted-foreground">Never</span>
        ),
    },
    {
      header: "Status",
      cell: (r) => <StatusBadge status={r.is_active ? "Active" : "Revoked"} />,
    },
    {
      header: "",
      className: "text-right",
      cell: (r) =>
        r.is_active ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => revokeKey(r)}
            disabled={revoke.isPending}
          >
            Revoke
          </Button>
        ) : null,
    },
  ];

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>API keys</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Sent as <code className="font-mono">X-Api-Key</code> on{" "}
              <code className="font-mono">/api/v1/ecommerce/*</code>.
            </p>
          </div>
          <Button onClick={() => setIssuing(true)}>
            <KeyRound className="mr-2 h-4 w-4" />
            Issue key
          </Button>
        </CardHeader>
        <CardContent>
          {isError && (
            <p className="mb-4 text-sm text-destructive">
              {error instanceof Error ? error.message : "Could not load keys."}
            </p>
          )}
          <DataTable
            columns={columns}
            rows={keys}
            isLoading={isFetching && !keys}
            rowKey={(r) => r.id}
            emptyMessage="No keys issued yet."
          />
        </CardContent>
      </Card>

      <IssueKeyDialog
        clientId={clientId}
        open={issuing}
        onOpenChange={setIssuing}
        onIssued={(key) => {
          setIssuing(false);
          setIssued(key);
        }}
      />
      <RevealKeyDialog issued={issued} onClose={() => setIssued(null)} />
    </>
  );
}

function IssueKeyDialog({
  clientId,
  open,
  onOpenChange,
  onIssued,
}: {
  clientId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIssued: (key: ApiKeyCreated) => void;
}) {
  const [environment, setEnvironment] = useState<ApiKeyEnvironment>("sandbox");
  const [rateLimit, setRateLimit] = useState("60");
  const issue = useIssueApiKey();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      const key = await issue.mutateAsync({
        clientId,
        environment,
        rateLimitPerMinute: Number(rateLimit) || 60,
      });
      onIssued(key);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not issue the key"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Issue an API key</DialogTitle>
            <DialogDescription>
              Start a merchant on sandbox. Move them to live once they have booked
              a test shipment end to end.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="environment">Environment</Label>
              <Select
                value={environment}
                onValueChange={(v) => setEnvironment(v as ApiKeyEnvironment)}
              >
                <SelectTrigger id="environment">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">Sandbox (sk_test_…)</SelectItem>
                  <SelectItem value="live">Live (sk_live_…)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rate_limit">Requests per minute</Label>
              <Input
                id="rate_limit"
                inputMode="numeric"
                value={rateLimit}
                onChange={(e) => setRateLimit(e.target.value)}
              />
              {/*
                The rate limit lives on the key, not in any server config, so
                this field is the only place it is ever set.
              */}
              <p className="text-xs text-muted-foreground">
                Applies to this key alone. 60 suits a normal merchant; raise it
                for a busy integration.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={issue.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={issue.isPending}>
              {issue.isPending ? "Issuing…" : "Issue key"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RevealKeyDialog({
  issued,
  onClose,
}: {
  issued: ApiKeyCreated | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!issued) return;
    try {
      await navigator.clipboard.writeText(issued.api_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access is refused outside a secure context and in some
      // browsers' permission settings. The key is on screen and selectable, so
      // this is a missing convenience rather than a failure worth an error.
      toast.message("Copy the key from the box above");
    }
  }

  return (
    <Dialog
      open={issued !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Key issued</DialogTitle>
          <DialogDescription>
            Send it to the merchant through a password manager, not email or chat.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-sm">
              This is the only time the key is shown. Only a hash is stored, so
              nobody — including us — can read it again. If it is lost, revoke it
              and issue another.
            </p>
          </div>

          <div className="rounded-lg border bg-muted/50 p-3">
            <code className="block break-all font-mono text-sm">
              {issued?.api_key}
            </code>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {issued?.environment === "live" ? "Live" : "Sandbox"} ·{" "}
              {issued?.rate_limit_per_minute}/min
            </span>
            <Button variant="outline" size="sm" onClick={copy}>
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy key
                </>
              )}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>I have saved it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
