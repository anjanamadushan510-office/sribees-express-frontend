"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Loader2 } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useDeviceSettings, useUpdateDeviceSettings } from "@/lib/hooks/use-admin-sorting";
import { getErrorMessage } from "@/lib/api/client";
import type { DeviceSettingRow } from "@/types/admin-sorting";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function SortingDeviceSettingsTab() {
  const { hasPermission } = useAuth();
  const { data, isLoading, isError } = useDeviceSettings();
  const [editRow, setEditRow] = useState<DeviceSettingRow | null>(null);

  const columns: Column<DeviceSettingRow>[] = [
    { header: "Bucket", cell: (r) => <span className="font-medium">{r.bucket_name}</span> },
    { header: "Parent section", cell: (r) => r.parent_bucket ?? "—" },
    { header: "Device URL", cell: (r) => r.device_url ?? "—" },
    {
      header: "",
      cell: (r) =>
        hasPermission("sorting-devices-update") ? (
          <Button variant="ghost" size="icon-sm" onClick={() => setEditRow(r)}>
            <Pencil className="size-4" />
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="mt-4">
      {isError ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Couldn&apos;t load device settings right now.
          </CardContent>
        </Card>
      ) : (
        <DataTable
          columns={columns}
          rows={data}
          isLoading={isLoading}
          rowKey={(r) => r.id}
          emptyMessage="No sorting-bucket devices found."
        />
      )}

      <EditDeviceDialog row={editRow} onOpenChange={(o) => !o && setEditRow(null)} />
    </div>
  );
}

function EditDeviceDialog({
  row,
  onOpenChange,
}: {
  row: DeviceSettingRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={row !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit device — {row?.bucket_name}</DialogTitle>
        </DialogHeader>
        {row && <EditDeviceForm key={row.id} row={row} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function EditDeviceForm({ row, onDone }: { row: DeviceSettingRow; onDone: () => void }) {
  const [deviceUrl, setDeviceUrl] = useState(row.device_url ?? "");
  const [deviceId, setDeviceId] = useState("");
  const mutation = useUpdateDeviceSettings();

  const submit = () => {
    if (!deviceUrl.trim()) {
      toast.error("Device URL is required");
      return;
    }
    mutation.mutate(
      { id: row.id, device_url: deviceUrl.trim(), device_id: deviceId || undefined },
      {
        onSuccess: () => {
          toast.success("Device settings updated");
          onDone();
        },
        onError: (error) =>
          toast.error(getErrorMessage(error, "Could not update device settings")),
      }
    );
  };

  return (
    <>
      <div className="space-y-3">
        <div>
          <Label className="mb-1.5 block">Device URL</Label>
          <Input value={deviceUrl} onChange={(e) => setDeviceUrl(e.target.value)} />
        </div>
        <div>
          <Label className="mb-1.5 block">Device ID (optional)</Label>
          <Input value={deviceId} onChange={(e) => setDeviceId(e.target.value)} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button disabled={mutation.isPending} onClick={submit}>
          {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
          Save
        </Button>
      </DialogFooter>
    </>
  );
}
