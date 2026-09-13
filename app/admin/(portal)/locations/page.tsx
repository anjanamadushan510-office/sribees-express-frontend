"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { createZone, updateZone } from "@/lib/api/admin-geo";
import { useGeoZones } from "@/lib/hooks/use-geo";
import type { Zone, ZoneCreate } from "@/types/admin-geo";
import { getErrorMessage } from "@/lib/api/client";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PostalCitiesTab } from "@/components/admin/postal-cities-tab";

export default function AdminLocationsPage() {
  return (
    <>
      <PageHeader
        title="Locations"
        description="Postal cities are where every address lives. A zone prices a postal city; a branch covers it."
      />
      <Tabs defaultValue="postal-cities">
        <TabsList>
          <TabsTrigger value="postal-cities">Postal cities</TabsTrigger>
          <TabsTrigger value="zones">Zones</TabsTrigger>
        </TabsList>
        <TabsContent value="postal-cities">
          <PostalCitiesTab />
        </TabsContent>
        <TabsContent value="zones">
          <ZonesTab />
        </TabsContent>
      </Tabs>
    </>
  );
}

const money = (value: string) =>
  Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 });

/**
 * Pricing tiers. A zone does nothing until postal cities are given it on the
 * Postal cities tab, and deactivating one stops delivery to every city it
 * prices — the merchant API drops them from its list at once.
 */
function ZonesTab() {
  const { data: zones, isFetching, isError, error } = useGeoZones();
  const [editing, setEditing] = useState<Zone | "new" | null>(null);

  const columns: Column<Zone>[] = [
    { header: "Zone", cell: (r) => <span className="font-medium">{r.name}</span> },
    { header: "First kg", className: "text-right", cell: (r) => money(r.first_kg) },
    { header: "Each kg after", className: "text-right", cell: (r) => money(r.after_kg) },
    { header: "Return first kg", className: "text-right", cell: (r) => money(r.return_first_kg) },
    {
      header: "Return each kg after",
      className: "text-right",
      cell: (r) => money(r.return_after_kg),
    },
    {
      header: "Status",
      cell: (r) => <StatusBadge status={r.is_active ? "Active" : "Inactive"} />,
    },
  ];

  return (
    <>
      <Card className="mt-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Zones</CardTitle>
          <Button onClick={() => setEditing("new")}>
            <Plus className="mr-2 h-4 w-4" />
            New zone
          </Button>
        </CardHeader>
        <CardContent>
          {isError && (
            <p className="mb-4 text-sm text-destructive">
              {error instanceof Error ? error.message : "Could not load zones."}
            </p>
          )}
          <DataTable
            columns={columns}
            rows={zones}
            isLoading={isFetching && !zones}
            rowKey={(r) => r.id}
            onRowClick={(r) => setEditing(r)}
            emptyMessage="No zones yet — create one before pricing any postal city."
          />
        </CardContent>
      </Card>

      {editing !== null && (
        <ZoneDialog zone={editing === "new" ? null : editing} onClose={() => setEditing(null)} />
      )}
    </>
  );
}

const RATE_FIELDS: { key: keyof ZoneCreate; label: string }[] = [
  { key: "first_kg", label: "First kg (LKR)" },
  { key: "after_kg", label: "Each kg after (LKR)" },
  { key: "return_first_kg", label: "Return first kg (LKR)" },
  { key: "return_after_kg", label: "Return each kg after (LKR)" },
];

function ZoneDialog({ zone, onClose }: { zone: Zone | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ZoneCreate>({
    name: zone?.name ?? "",
    first_kg: zone?.first_kg ?? "",
    after_kg: zone?.after_kg ?? "",
    return_first_kg: zone?.return_first_kg ?? "",
    return_after_kg: zone?.return_after_kg ?? "",
  });
  const [isActive, setIsActive] = useState(zone?.is_active ?? true);

  const save = useMutation({
    // Decimal strings, never numbers: these are NUMERIC columns and a float
    // round-trip is exactly what a price must not go through.
    mutationFn: () =>
      zone ? updateZone(zone.id, { ...form, is_active: isActive }) : createZone(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["geo-zones"] });
      toast.success(zone ? "Zone updated" : "Zone created");
      onClose();
    },
    onError: (err) => toast.error(getErrorMessage(err, "Could not save the zone")),
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <DialogHeader>
            <DialogTitle>{zone ? `Edit ${zone.name}` : "New zone"}</DialogTitle>
            <DialogDescription>
              A new rate applies to quotes from now on. Parcels already booked keep
              the price they were quoted.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="zone_name">Name</Label>
              <Input
                id="zone_name"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {RATE_FIELDS.map(({ key, label }) => (
                <div key={key} className="grid gap-2">
                  <Label htmlFor={`zone_${key}`}>{label}</Label>
                  <Input
                    id={`zone_${key}`}
                    required
                    inputMode="decimal"
                    pattern="\d+(\.\d{1,2})?"
                    value={form[key] ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            {zone && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                Active — unticking stops delivery to every postal city in this zone
              </label>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={save.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save zone"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
