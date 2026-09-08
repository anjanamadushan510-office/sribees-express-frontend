"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useNotificationDetail, useUpdateNotification } from "@/lib/hooks/use-admin-notifications";
import { getErrorMessage } from "@/lib/api/client";
import type { NotificationDetail } from "@/types/admin-notification";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

export function NotificationEditDialog({
  channel,
  id,
  onOpenChange,
}: {
  channel: "sms" | "ereceipt";
  id: number | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { data, isLoading, isError } = useNotificationDetail(channel, id);

  return (
    <Dialog open={id !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {channel === "sms" ? "SMS" : "E-receipt"} notification</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : isError || !data ? (
          <p className="text-sm text-muted-foreground">Could not load this setting.</p>
        ) : (
          <EditForm
            key={id}
            channel={channel}
            id={id as number}
            data={data}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function EditForm({
  channel,
  id,
  data,
  onDone,
}: {
  channel: "sms" | "ereceipt";
  id: number;
  data: NotificationDetail;
  onDone: () => void;
}) {
  const [messageBody, setMessageBody] = useState(data.message_body ?? "");
  const [clientActive, setClientActive] = useState(!!data.is_client_active);
  const [customerActive, setCustomerActive] = useState(!!data.is_customer_active);
  const mutation = useUpdateNotification(channel, id);

  const submit = () => {
    mutation.mutate(
      {
        message_body: messageBody || undefined,
        is_client_active: clientActive,
        is_customer_active: customerActive,
      },
      {
        onSuccess: () => {
          toast.success("Notification setting updated");
          onDone();
        },
        onError: (error) => toast.error(getErrorMessage(error, "Could not save changes")),
      }
    );
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Status: {data.status}</p>
      <div>
        <Label className="mb-1.5 block">Message body</Label>
        <Textarea
          value={messageBody}
          onChange={(e) => setMessageBody(e.target.value)}
          rows={3}
          maxLength={200}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="mb-1.5 block">Notify client</Label>
          <Select
            value={clientActive ? "yes" : "no"}
            onValueChange={(v) => setClientActive(v === "yes")}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-1.5 block">Notify customer</Label>
          <Select
            value={customerActive ? "yes" : "no"}
            onValueChange={(v) => setCustomerActive(v === "yes")}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button disabled={mutation.isPending} onClick={submit}>
          {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
          Save changes
        </Button>
      </DialogFooter>
    </div>
  );
}
