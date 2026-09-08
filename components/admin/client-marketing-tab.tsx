"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  useClientMarketing,
  useStaffDropdown,
  useUpdateClientMarketing,
} from "@/lib/hooks/use-admin-clients";
import { getErrorMessage } from "@/lib/api/client";
import type { ClientMarketingInfo } from "@/types/admin-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Combobox } from "@/components/shared/combobox";

export function ClientMarketingTab({ clientId }: { clientId: number }) {
  const { data, isLoading, isError } = useClientMarketing(clientId);

  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (isError || !data)
    return (
      <p className="py-6 text-sm text-muted-foreground">
        Couldn&apos;t load marketing details for this client.
      </p>
    );

  return <MarketingForm key={clientId} clientId={clientId} data={data} />;
}

function MarketingForm({
  clientId,
  data,
}: {
  clientId: number;
  data: ClientMarketingInfo;
}) {
  const { data: staff, isLoading: staffLoading } = useStaffDropdown();
  const mutation = useUpdateClientMarketing(clientId);

  const [commissionEntitledId, setCommissionEntitledId] = useState(
    data.commission_entitled_id != null ? String(data.commission_entitled_id) : ""
  );
  const [introducedById, setIntroducedById] = useState(
    data.introduced_by_id != null ? String(data.introduced_by_id) : ""
  );
  const [waybillAmount, setWaybillAmount] = useState("");
  const [barcodeAmount, setBarcodeAmount] = useState("");

  const staffOptions = useMemo(
    () => (staff ?? []).map((s) => ({ value: String(s.key), label: s.value })),
    [staff]
  );

  const submit = () => {
    if (!commissionEntitledId || !introducedById) {
      toast.error("Select both a commission-entitled staff member and who introduced this client");
      return;
    }
    mutation.mutate(
      {
        commission_entitled_id: Number(commissionEntitledId),
        introduced_by_id: Number(introducedById),
        ...(waybillAmount ? { waybill_amount: Number(waybillAmount) } : {}),
        ...(barcodeAmount ? { barcode_amount: Number(barcodeAmount) } : {}),
      },
      {
        onSuccess: () => toast.success("Marketing settings updated"),
        onError: (error) =>
          toast.error(getErrorMessage(error, "Could not save marketing settings")),
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Marketing attribution</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label className="mb-1.5 block">Commission entitled to</Label>
          <Combobox
            options={staffOptions}
            value={commissionEntitledId}
            onChange={setCommissionEntitledId}
            placeholder={staffLoading ? "Loading…" : "Select staff member"}
            searchPlaceholder="Search staff…"
            emptyMessage="No staff found."
            disabled={staffLoading}
          />
        </div>
        <div>
          <Label className="mb-1.5 block">Introduced by</Label>
          <Combobox
            options={staffOptions}
            value={introducedById}
            onChange={setIntroducedById}
            placeholder={staffLoading ? "Loading…" : "Select staff member"}
            searchPlaceholder="Search staff…"
            emptyMessage="No staff found."
            disabled={staffLoading}
          />
        </div>
        <div>
          <Label className="mb-1.5 block">Waybill amount (optional)</Label>
          <Input
            type="number"
            value={waybillAmount}
            onChange={(e) => setWaybillAmount(e.target.value)}
          />
        </div>
        <div>
          <Label className="mb-1.5 block">Barcode amount (optional)</Label>
          <Input
            type="number"
            value={barcodeAmount}
            onChange={(e) => setBarcodeAmount(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2 flex justify-end">
          <Button disabled={mutation.isPending} onClick={submit}>
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Save marketing settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
