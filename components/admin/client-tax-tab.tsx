"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  useClientTax,
  useTaxTypesDropdown,
  useUpdateClientTax,
} from "@/lib/hooks/use-admin-clients";
import { getErrorMessage } from "@/lib/api/client";
import type { ClientTaxInfo } from "@/types/admin-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/shared/multi-select";

export function ClientTaxTab({ clientId }: { clientId: number }) {
  const { data, isLoading, isError } = useClientTax(clientId);

  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (isError || !data)
    return (
      <p className="py-6 text-sm text-muted-foreground">
        Couldn&apos;t load tax details for this client.
      </p>
    );

  // Keyed by clientId so the form's local state re-initialises per client
  // instead of syncing via a setState-in-effect anti-pattern.
  return <TaxForm key={clientId} clientId={clientId} data={data} />;
}

function TaxForm({ clientId, data }: { clientId: number; data: ClientTaxInfo }) {
  const { data: taxTypes, isLoading: typesLoading } = useTaxTypesDropdown();
  const mutation = useUpdateClientTax(clientId);

  const [isActive, setIsActive] = useState(!!data.is_tax_active);
  const [taxTypeIds, setTaxTypeIds] = useState<string[]>((data.tax_type ?? []).map(String));
  const [taxNumber, setTaxNumber] = useState(
    data.tax_number != null ? String(data.tax_number) : ""
  );

  const taxTypeOptions = useMemo(
    () => (taxTypes ?? []).map((t) => ({ value: String(t.key), label: t.value })),
    [taxTypes]
  );

  const submit = () => {
    mutation.mutate(
      {
        is_tax_active: isActive,
        tax_type: taxTypeIds.map(Number),
        tax_number: Number(taxNumber),
      },
      {
        onSuccess: () => toast.success("Tax settings updated"),
        onError: (error) => toast.error(getErrorMessage(error, "Could not save tax settings")),
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tax registration</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label className="mb-1.5 block">Tax active</Label>
          <Select value={isActive ? "yes" : "no"} onValueChange={(v) => setIsActive(v === "yes")}>
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
          <Label className="mb-1.5 block">Tax number</Label>
          <Input
            type="number"
            value={taxNumber}
            onChange={(e) => setTaxNumber(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <Label className="mb-1.5 block">Tax types</Label>
          <MultiSelect
            options={taxTypeOptions}
            value={taxTypeIds}
            onChange={setTaxTypeIds}
            placeholder={typesLoading ? "Loading…" : "Select tax types"}
            searchPlaceholder="Search…"
            emptyMessage="No tax types found."
            disabled={typesLoading}
          />
        </div>
        <div className="sm:col-span-2 flex justify-end">
          <Button disabled={mutation.isPending} onClick={submit}>
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Save tax settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
