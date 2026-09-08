"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useClientFinance, useUpdateClientFinance } from "@/lib/hooks/use-admin-clients";
import { getErrorMessage } from "@/lib/api/client";
import type { ClientFinance, UpdateFinancePayload, ZoneRateCard } from "@/types/admin-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const INVOICE_TYPES = ["Days", "Week", "Month"] as const;
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thur", "Fri", "Sat", "Sun"] as const;

type ZoneEdit = Pick<
  ZoneRateCard,
  "id" | "z_name" | "first_kg" | "after_kg" | "return_first_kg" | "return_after_kg" | "delivery_weight_margin"
>;

export function ClientFinanceTab({ clientId }: { clientId: number }) {
  const { data, isLoading, isError } = useClientFinance(clientId);

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (isError || !data)
    return (
      <p className="py-6 text-sm text-muted-foreground">
        Couldn&apos;t load finance details for this client.
      </p>
    );

  return <FinanceForm key={clientId} clientId={clientId} data={data} />;
}

function FinanceForm({ clientId, data }: { clientId: number; data: ClientFinance }) {
  const mutation = useUpdateClientFinance(clientId);

  const [zones, setZones] = useState<ZoneEdit[]>(
    data.rate_card.map((z) => ({
      id: z.id,
      z_name: z.z_name,
      first_kg: z.first_kg,
      after_kg: z.after_kg,
      return_first_kg: z.return_first_kg,
      return_after_kg: z.return_after_kg,
      delivery_weight_margin: z.delivery_weight_margin,
    }))
  );
  const [cityRequired, setCityRequired] = useState(!!data.city_required_option);
  const [invPeriod, setInvPeriod] = useState(
    String(data.client_invoice_period.client_inv_period ?? 1)
  );
  const [invoiceType, setInvoiceType] = useState<(typeof INVOICE_TYPES)[number]>(
    (data.client_invoice_period.invoice_type as (typeof INVOICE_TYPES)[number]) || "Days"
  );
  const [nextInvoiceDate, setNextInvoiceDate] = useState(
    data.client_invoice_period.next_invoice_date?.slice(0, 10) ?? ""
  );
  const [cancelDays, setCancelDays] = useState(String(data.other.cancel_days ?? 0));
  const [commission, setCommission] = useState(String(data.other.commission ?? 0));
  const [maxAccount, setMaxAccount] = useState(String(data.other.max_account ?? 0));
  const [setoffActive, setSetoffActive] = useState(!!data.other.is_setoff_active);
  const [weekday, setWeekday] = useState<string>(data.client_invoice_period.weekday ?? "");
  const [monthField, setMonthField] = useState(data.client_invoice_period.day_of_month ?? "");

  const updateZone = (id: number, field: keyof ZoneEdit, value: string) => {
    setZones((zs) => zs.map((z) => (z.id === id ? { ...z, [field]: value } : z)));
  };

  const submit = () => {
    const payload: UpdateFinancePayload = {
      zones: zones.map((z) => ({
        id: z.id,
        first_kg: Number(z.first_kg),
        after_kg: Number(z.after_kg),
        return_first_kg: Number(z.return_first_kg),
        return_after_kg: Number(z.return_after_kg),
        delivery_weight_margin: Number(z.delivery_weight_margin),
      })),
      is_city_active: cityRequired,
      client_inv_period: Number(invPeriod),
      invoice_type: invoiceType,
      next_invoice_date: nextInvoiceDate,
      cancel_days: Number(cancelDays),
      commission: Number(commission),
      max_account: Number(maxAccount),
      is_setoff_active: setoffActive,
      ...(weekday ? { weekday } : {}),
      ...(invoiceType === "Month" && monthField ? { month_field: monthField } : {}),
    };

    mutation.mutate(payload, {
      onSuccess: () => toast.success("Finance settings updated"),
      onError: (error) => toast.error(getErrorMessage(error, "Could not save finance settings")),
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rate card by zone</CardTitle>
        </CardHeader>
        <CardContent>
          {zones.length === 0 ? (
            <p className="text-sm text-muted-foreground">No zone rates configured yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zone</TableHead>
                    <TableHead>1st KG</TableHead>
                    <TableHead>After KG</TableHead>
                    <TableHead>Weight margin</TableHead>
                    <TableHead>Return 1st KG</TableHead>
                    <TableHead>Return after KG</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {zones.map((z) => (
                    <TableRow key={z.id}>
                      <TableCell className="font-medium">{z.z_name}</TableCell>
                      {(
                        [
                          "first_kg",
                          "after_kg",
                          "delivery_weight_margin",
                          "return_first_kg",
                          "return_after_kg",
                        ] as const
                      ).map((field) => (
                        <TableCell key={field}>
                          <Input
                            type="number"
                            step="0.01"
                            className="w-24"
                            value={z[field]}
                            onChange={(e) => updateZone(z.id, field, e.target.value)}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invoicing</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Invoice type">
            <Select
              value={invoiceType}
              onValueChange={(v) => setInvoiceType(v as (typeof INVOICE_TYPES)[number])}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INVOICE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Every N periods">
            <Input
              type="number"
              min={1}
              value={invPeriod}
              onChange={(e) => setInvPeriod(e.target.value)}
            />
          </Field>
          <Field label="Next invoice date">
            <Input
              type="date"
              value={nextInvoiceDate}
              onChange={(e) => setNextInvoiceDate(e.target.value)}
            />
          </Field>
          {invoiceType === "Week" && (
            <Field label="Weekday">
              <Select value={weekday} onValueChange={setWeekday}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select weekday" />
                </SelectTrigger>
                <SelectContent>
                  {WEEKDAYS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
          {invoiceType === "Month" && (
            <Field label="Days of month (comma-separated, 'E' = end of month)">
              <Input
                value={monthField}
                onChange={(e) => setMonthField(e.target.value)}
                placeholder="1,15,E"
              />
            </Field>
          )}
          <Field label="Cancel window (days)">
            <Input
              type="number"
              value={cancelDays}
              onChange={(e) => setCancelDays(e.target.value)}
            />
          </Field>
          <Field label="Commission">
            <Input
              type="number"
              value={commission}
              onChange={(e) => setCommission(e.target.value)}
            />
          </Field>
          <Field label="Max account balance">
            <Input
              type="number"
              value={maxAccount}
              onChange={(e) => setMaxAccount(e.target.value)}
            />
          </Field>
          <Field label="City required at booking">
            <Select
              value={cityRequired ? "yes" : "no"}
              onValueChange={(v) => setCityRequired(v === "yes")}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Set-off enabled">
            <Select
              value={setoffActive ? "yes" : "no"}
              onValueChange={(v) => setSetoffActive(v === "yes")}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button disabled={mutation.isPending} onClick={submit}>
          {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
          Save finance settings
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}
