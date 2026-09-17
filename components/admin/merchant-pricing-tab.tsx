"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  useClientZoneRates,
  useUpdateClientZoneRate,
  useUpsertClientZoneRate,
} from "@/lib/hooks/use-admin-finance-pricing";
import { useGeoZones } from "@/lib/hooks/use-geo";
import { getErrorMessage } from "@/lib/api/client";
import { formatCurrency } from "@/lib/format";
import type { ClientZoneRate } from "@/types/admin-finance-pricing";
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

const RATE_PATTERN = "\\d+(\\.\\d{1,2})?";

/**
 * A merchant's own negotiated rate per destination zone, overriding that
 * zone's (or a `ZoneLane`'s) standard rate for this merchant only —
 * everyone else keeps pricing as before. One row per zone; adding a rate for
 * a zone that already has one replaces it, same as `ZoneLanesTab` on the
 * Locations page treats a (from, to) pair.
 */
export function MerchantPricingTab({ clientId }: { clientId: number }) {
  const { data: rates, isFetching, isError, error } = useClientZoneRates(clientId);
  const { data: zones } = useGeoZones();
  const update = useUpdateClientZoneRate(clientId);
  const [editing, setEditing] = useState<ClientZoneRate | "new" | null>(null);
  const zoneName = (id: number) => zones?.find((z) => z.id === id)?.name ?? `#${id}`;

  async function setActive(rate: ClientZoneRate, isActive: boolean) {
    try {
      await update.mutateAsync({ id: rate.id, payload: { is_active: isActive } });
      toast.success(isActive ? "Override reactivated" : "Override switched off");
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not change this override"));
    }
  }

  const columns: Column<ClientZoneRate>[] = [
    { header: "Zone", cell: (r) => <span className="font-medium">{zoneName(r.zone_id)}</span> },
    { header: "First kg", className: "text-right", cell: (r) => formatCurrency(r.first_kg) },
    { header: "Each kg after", className: "text-right", cell: (r) => formatCurrency(r.after_kg) },
    {
      header: "Status",
      cell: (r) => <StatusBadge status={r.is_active ? "Active" : "Off"} />,
    },
    {
      header: "",
      className: "text-right",
      cell: (r) => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing(r)}>
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActive(r, !r.is_active)}
            disabled={update.isPending}
          >
            {r.is_active ? "Turn off" : "Reactivate"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Zone pricing overrides</CardTitle>
          <Button onClick={() => setEditing("new")}>
            <Plus className="mr-2 h-4 w-4" />
            Add override
          </Button>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            A rate here wins over the zone&apos;s (or a lane&apos;s) standard rate for this
            merchant only — every other merchant is unaffected.
          </p>
          {isError && (
            <p className="mb-4 text-sm text-destructive">
              {error instanceof Error ? error.message : "Could not load pricing overrides."}
            </p>
          )}
          <DataTable
            columns={columns}
            rows={rates}
            isLoading={isFetching && !rates}
            rowKey={(r) => r.id}
            emptyMessage="No custom pricing for this merchant — standard zone rates apply."
          />
        </CardContent>
      </Card>

      {editing !== null && (
        <RateDialog
          clientId={clientId}
          rate={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

function RateDialog({
  clientId,
  rate,
  onClose,
}: {
  clientId: number;
  rate: ClientZoneRate | null;
  onClose: () => void;
}) {
  const { data: zones } = useGeoZones();
  const upsert = useUpsertClientZoneRate(clientId);
  const update = useUpdateClientZoneRate(clientId);
  const pending = upsert.isPending || update.isPending;
  const [zoneId, setZoneId] = useState(rate ? String(rate.zone_id) : "");
  const [firstKg, setFirstKg] = useState(rate?.first_kg ?? "");
  const [afterKg, setAfterKg] = useState(rate?.after_kg ?? "");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!zoneId) {
      toast.error("Choose a zone");
      return;
    }
    try {
      if (rate) {
        await update.mutateAsync({ id: rate.id, payload: { first_kg: firstKg, after_kg: afterKg } });
      } else {
        await upsert.mutateAsync({
          client_id: clientId,
          zone_id: Number(zoneId),
          first_kg: firstKg,
          after_kg: afterKg,
        });
      }
      toast.success(rate ? "Override updated" : "Override added");
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not save this override"));
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>
              {rate
                ? `Edit ${zones?.find((z) => z.id === rate.zone_id)?.name ?? "zone"} rate`
                : "Add a zone override"}
            </DialogTitle>
            <DialogDescription>
              Posting again for the same zone replaces its rate rather than adding a duplicate.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="rate_zone">Zone</Label>
              <Select value={zoneId} onValueChange={setZoneId} disabled={rate !== null}>
                <SelectTrigger id="rate_zone" className="w-full">
                  <SelectValue placeholder="Select a zone" />
                </SelectTrigger>
                <SelectContent>
                  {(zones ?? []).map((zone) => (
                    <SelectItem key={zone.id} value={String(zone.id)}>
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="rate_first_kg">First kg (LKR)</Label>
                <Input
                  id="rate_first_kg"
                  required
                  inputMode="decimal"
                  pattern={RATE_PATTERN}
                  value={firstKg}
                  onChange={(e) => setFirstKg(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rate_after_kg">Each kg after (LKR)</Label>
                <Input
                  id="rate_after_kg"
                  required
                  inputMode="decimal"
                  pattern={RATE_PATTERN}
                  value={afterKg}
                  onChange={(e) => setAfterKg(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
