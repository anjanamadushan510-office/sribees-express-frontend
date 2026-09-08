"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useClientStatusTypes } from "@/lib/hooks/use-client-orders";
import {
  useStatusMapping,
  useUpdateOrderMapping,
  useUpdateStatusMapping,
} from "@/lib/hooks/use-webhook";
import { getErrorMessage } from "@/lib/api/client";
import { STATUS_MAPPING_KEYS, type StatusMappingKeys } from "@/types/webhook";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ORDER_FIELDS: { key: string; label: string }[] = [
  { key: "waybill_id", label: "Waybill ID field name" },
  { key: "order_no", label: "Order No field name" },
  { key: "customer_name", label: "Customer name field name" },
  { key: "address", label: "Address field name" },
  { key: "phone_no", label: "Phone field name" },
  { key: "phone_no2", label: "Alt. phone field name" },
  { key: "description", label: "Description field name" },
  { key: "city_id", label: "City field name" },
  { key: "cod", label: "COD field name" },
  { key: "note", label: "Note field name" },
  { key: "status_id", label: "Status field name" },
];

export function WebhookSettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Webhook settings</DialogTitle>
          <DialogDescription>
            Push order status changes and new orders to your own system automatically.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="status">
          <TabsList>
            <TabsTrigger value="status">Status mapping</TabsTrigger>
            <TabsTrigger value="order">Order mapping</TabsTrigger>
          </TabsList>
          <TabsContent value="status">
            <StatusMappingForm open={open} />
          </TabsContent>
          <TabsContent value="order">
            <OrderMappingForm />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function StatusMappingForm({ open }: { open: boolean }) {
  const { data, isLoading } = useStatusMapping(open);
  const { data: statusTypes } = useClientStatusTypes();
  const mutation = useUpdateStatusMapping();

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <StatusMappingFields initial={data} statusTypes={statusTypes} mutation={mutation} />;
}

function StatusMappingFields({
  initial,
  statusTypes,
  mutation,
}: {
  initial: { url: string | null; method: string | null } | undefined;
  statusTypes: { key: string; value: string }[] | undefined;
  mutation: ReturnType<typeof useUpdateStatusMapping>;
}) {
  const [url, setUrl] = useState(initial?.url ?? "");
  const [keys, setKeys] = useState<StatusMappingKeys>({});

  const labelFor = (key: string) => statusTypes?.find((s) => s.key === key)?.value ?? key;

  const onSubmit = () => {
    mutation.mutate(
      { url: url || undefined, method: "post", ...keys },
      {
        onSuccess: () => toast.success("Status mapping updated"),
        onError: (error) => toast.error(getErrorMessage(error, "Could not update status mapping")),
      }
    );
  };

  return (
    <div className="space-y-4 py-2">
      <div>
        <Label className="mb-1.5 block">Webhook URL</Label>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://your-system.example.com/webhook/status"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Requests are always sent as HTTP POST.
        </p>
      </div>
      <div>
        <Label className="mb-1.5 block">Status code mapping</Label>
        <p className="mb-2 text-xs text-muted-foreground">
          For each SRIBEES status, enter the status code your system expects to receive.
          Leave blank to skip mapping that status.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {STATUS_MAPPING_KEYS.map((key) => (
            <div key={key}>
              <Label className="mb-1 block text-xs">{labelFor(key)}</Label>
              <Input
                value={keys[key] ?? ""}
                onChange={(e) => setKeys((k) => ({ ...k, [key]: e.target.value }))}
                placeholder="e.g. DELIVERED"
              />
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={onSubmit} disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
          Save status mapping
        </Button>
      </div>
    </div>
  );
}

function OrderMappingForm() {
  const mutation = useUpdateOrderMapping();
  const [url, setUrl] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [headers, setHeaders] = useState<{ header: string; value: string }[]>([
    { header: "", value: "" },
    { header: "", value: "" },
    { header: "", value: "" },
    { header: "", value: "" },
  ]);

  const onSubmit = () => {
    const payload: Record<string, string> = { url: url || undefined, method: "post" } as Record<
      string,
      string
    >;
    for (const [k, v] of Object.entries(fields)) {
      if (v) payload[k] = v;
    }
    headers.forEach((h, i) => {
      if (h.header) payload[`header_${i + 1}`] = h.header;
      if (h.value) payload[`value_${i + 1}`] = h.value;
    });

    mutation.mutate(payload, {
      onSuccess: () => toast.success("Order mapping updated"),
      onError: (error) => toast.error(getErrorMessage(error, "Could not update order mapping")),
    });
  };

  return (
    <div className="space-y-4 py-2">
      <p className="text-xs text-muted-foreground">
        This form is write-only — the backend doesn&apos;t expose a way to fetch your current
        order-mapping config back, so re-enter every field you want to keep on each save.
      </p>
      <div>
        <Label className="mb-1.5 block">Webhook URL</Label>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://your-system.example.com/webhook/order"
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {ORDER_FIELDS.map((f) => (
          <div key={f.key}>
            <Label className="mb-1 block text-xs">{f.label}</Label>
            <Input
              value={fields[f.key] ?? ""}
              onChange={(e) => setFields((s) => ({ ...s, [f.key]: e.target.value }))}
              placeholder={f.key}
            />
          </div>
        ))}
      </div>
      <div>
        <Label className="mb-1.5 block">Custom headers (optional, up to 4)</Label>
        <div className="space-y-2">
          {headers.map((h, i) => (
            <div key={i} className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Header name (e.g. Authorization)"
                value={h.header}
                onChange={(e) =>
                  setHeaders((hs) =>
                    hs.map((x, idx) => (idx === i ? { ...x, header: e.target.value } : x))
                  )
                }
              />
              <Input
                placeholder="Header value"
                value={h.value}
                onChange={(e) =>
                  setHeaders((hs) =>
                    hs.map((x, idx) => (idx === i ? { ...x, value: e.target.value } : x))
                  )
                }
              />
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={onSubmit} disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
          Save order mapping
        </Button>
      </div>
    </div>
  );
}
