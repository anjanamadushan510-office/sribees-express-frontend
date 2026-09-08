"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Eye, Loader2, Check } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useAdminClientsDropdown } from "@/lib/hooks/use-admin-orders";
import {
  useAdminClientNotifies,
  useCreateAdminClientNotify,
} from "@/lib/hooks/use-admin-client-notify";
import { getErrorMessage } from "@/lib/api/client";
import type { AdminClientNotifyRow, CreateClientNotifyPayload } from "@/types/admin-client-notify";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { MultiSelect } from "@/components/shared/multi-select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const PER_PAGE = 15;

const columns: Column<AdminClientNotifyRow>[] = [
  { header: "Date", cell: (r) => formatDate(r.date) },
  { header: "Type", cell: (r) => r.type.toUpperCase() },
  {
    header: "Message",
    cell: (r) => <span className="line-clamp-1 max-w-md">{r.announcement_message}</span>,
  },
  { header: "Recipient", cell: (r) => r.client_name ?? "—" },
  {
    header: "",
    cell: (r) => (
      <Button asChild variant="ghost" size="sm">
        <Link href={`/admin/clients/announcements/${r.id}`}>
          <Eye className="size-4" />
          View
        </Link>
      </Button>
    ),
  },
];

export default function AdminClientAnnouncementsPage() {
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isFetching, isError } = useAdminClientNotifies({ page, perPage: PER_PAGE });

  return (
    <>
      <div className="mb-1 flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title="Client Announcements"
          description="Send SMS/email announcements to clients, and review what's been sent."
        />
        {hasPermission("update-client") && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            New Announcement
          </Button>
        )}
      </div>
      <CreateAnnouncementDialog open={createOpen} onOpenChange={setCreateOpen} />

      {isError ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Couldn&apos;t load announcements right now. Check your connection and try again.
          </CardContent>
        </Card>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data?.items}
            isLoading={isFetching && !data}
            rowKey={(r) => `${r.id}-${r.client_id ?? r.client_email ?? r.client_name}`}
            emptyMessage="No announcements sent yet."
          />
          <Pagination pagination={data?.pagination} onPageChange={setPage} isLoading={isFetching} />
        </>
      )}
    </>
  );
}

function CreateAnnouncementDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: clients, isLoading: clientsLoading } = useAdminClientsDropdown();
  const mutation = useCreateAdminClientNotify();

  const [types, setTypes] = useState<Set<"sms" | "email">>(new Set(["email"]));
  const [clientIds, setClientIds] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [smsBody, setSmsBody] = useState("");

  const clientOptions = useMemo(
    () => (clients ?? []).map((c) => ({ value: String(c.key), label: c.value })),
    [clients]
  );

  const toggleType = (t: "sms" | "email") => {
    setTypes((s) => {
      const next = new Set(s);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };

  const submit = () => {
    if (types.size === 0 || clientIds.length === 0) {
      toast.error("Select at least one channel and one client");
      return;
    }
    if (types.has("email") && (!subject.trim() || !emailBody.trim())) {
      toast.error("Email subject and body are required for the email channel");
      return;
    }
    if (types.has("sms") && !smsBody.trim()) {
      toast.error("SMS body is required for the SMS channel");
      return;
    }

    const payload: CreateClientNotifyPayload = {
      type: Array.from(types),
      client_ids: clientIds.map(Number),
      subject: subject || undefined,
      email_body: emailBody || undefined,
      sms_body: smsBody || undefined,
    };

    mutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Announcement sent");
        setTypes(new Set(["email"]));
        setClientIds([]);
        setSubject("");
        setEmailBody("");
        setSmsBody("");
        onOpenChange(false);
      },
      onError: (error) => toast.error(getErrorMessage(error, "Could not send announcement")),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New announcement</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="mb-1.5 block">Channels</Label>
            <div className="flex gap-1.5">
              {(["email", "sms"] as const).map((t) => {
                const checked = types.has(t);
                return (
                  <button
                    type="button"
                    key={t}
                    onClick={() => toggleType(t)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      checked
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-input text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {checked && <Check className="size-3" />}
                    {t.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">Clients</Label>
            <MultiSelect
              options={clientOptions}
              value={clientIds}
              onChange={setClientIds}
              placeholder={clientsLoading ? "Loading…" : "Select clients"}
              searchPlaceholder="Search client…"
              emptyMessage="No client found."
              disabled={clientsLoading}
            />
          </div>
          {types.has("email") && (
            <>
              <div>
                <Label className="mb-1.5 block">Email subject</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
              <div>
                <Label className="mb-1.5 block">Email body</Label>
                <Textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} rows={4} />
              </div>
            </>
          )}
          {types.has("sms") && (
            <div>
              <Label className="mb-1.5 block">SMS body</Label>
              <Textarea value={smsBody} onChange={(e) => setSmsBody(e.target.value)} rows={3} />
              <p className="mt-1 text-xs text-muted-foreground">
                Note: actual SMS dispatch is currently disabled backend-side — this records the
                message but won&apos;t send a text yet.
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={mutation.isPending} onClick={submit}>
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
