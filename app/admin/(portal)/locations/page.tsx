"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { createZone, createZoneLane, updateZone, updateZoneLane } from "@/lib/api/admin-geo";
import { useAssignPostalCitiesToZone, useGeoZones, usePostalCities, useZoneLanes } from "@/lib/hooks/use-geo";
import type { Zone, ZoneCreate, ZoneLane } from "@/types/admin-geo";
import { getErrorMessage } from "@/lib/api/client";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
          <TabsTrigger value="lanes">Zone lanes</TabsTrigger>
        </TabsList>
        <TabsContent value="postal-cities">
          <PostalCitiesTab />
        </TabsContent>
        <TabsContent value="zones">
          <ZonesTab />
        </TabsContent>
        <TabsContent value="lanes">
          <ZoneLanesTab />
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

        {/*
          Postal cities go straight onto a zone here — no district step. Only
          shown once the zone exists (a brand-new zone has no id to assign
          against yet; save it, then reopen to add cities).
        */}
        {zone && <ZonePostalCities zone={zone} />}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Postal cities in one zone — search and add directly, no district in the
 * way. The full national directory (2,111 rows) is searched server-side;
 * "currently in this zone" reads the first 100, which covers a normal zone
 * (a bigger one is still viewable, filtered by zone, on the Postal cities
 * tab).
 */
function ZonePostalCities({ zone }: { zone: Zone }) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const assign = useAssignPostalCitiesToZone();

  const results = usePostalCities({ search: search || undefined, limit: 8 });
  const inZone = usePostalCities({ zone_id: zone.id, limit: 100 });

  async function add(postalCityId: number, name: string) {
    try {
      await assign.mutateAsync({ postal_city_ids: [postalCityId], zone_id: zone.id });
      toast.success(`${name} added to ${zone.name}`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not add this postal city"));
    }
  }

  async function remove(postalCityId: number, name: string) {
    try {
      await assign.mutateAsync({ postal_city_ids: [postalCityId], zone_id: null });
      toast.success(`${name} removed from ${zone.name}`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not remove this postal city"));
    }
  }

  return (
    <div className="mt-2 border-t pt-4">
      <Label className="mb-2 block">Postal cities in this zone</Label>
      <div className="relative mb-2">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder="Search postal cities to add"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && setSearch(searchInput.trim())}
        />
      </div>
      {search && (
        <div className="mb-3 flex flex-wrap gap-2">
          {results.isFetching && <span className="text-xs text-muted-foreground">Searching…</span>}
          {results.data?.items.length === 0 && (
            <span className="text-xs text-muted-foreground">No postal cities match.</span>
          )}
          {results.data?.items.map((c) => (
            <Button
              key={c.id}
              type="button"
              variant="outline"
              size="sm"
              disabled={c.zone_id === zone.id || assign.isPending}
              onClick={() => add(c.id, c.name)}
            >
              <Plus className="mr-1 h-3 w-3" />
              {c.name}
              {c.district ? ` (${c.district})` : ""}
            </Button>
          ))}
        </div>
      )}
      <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
        {inZone.data?.items.length === 0 && (
          <span className="text-xs text-muted-foreground">No postal cities in this zone yet.</span>
        )}
        {inZone.data?.items.map((c) => (
          <Badge key={c.id} variant="secondary" className="gap-1 pr-1">
            {c.name}
            <button
              type="button"
              aria-label={`Remove ${c.name}`}
              disabled={assign.isPending}
              onClick={() => remove(c.id, c.name)}
              className="rounded-full p-0.5 hover:bg-muted-foreground/20"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}

const RATE_PATTERN = "\\d+(\\.\\d{1,2})?";

/**
 * Prices between two zones. A merchant quote is priced from the zone of the
 * outlet's postal city to the zone of the customer's; an active lane for that
 * pair wins, otherwise the destination zone's own rate applies.
 */
function ZoneLanesTab() {
  const { data: zones } = useGeoZones();
  const { data: lanes, isFetching, isError, error } = useZoneLanes();
  const [editing, setEditing] = useState<ZoneLane | "new" | null>(null);
  const zoneName = (id: number) => zones?.find((z) => z.id === id)?.name ?? `#${id}`;

  const columns: Column<ZoneLane>[] = [
    {
      header: "From zone",
      cell: (r) => <span className="font-medium">{zoneName(r.origin_zone_id)}</span>,
    },
    { header: "To zone", cell: (r) => zoneName(r.destination_zone_id) },
    { header: "First kg", className: "text-right", cell: (r) => money(r.first_kg) },
    { header: "Each kg after", className: "text-right", cell: (r) => money(r.after_kg) },
    {
      header: "Status",
      cell: (r) => <StatusBadge status={r.is_active ? "Active" : "Inactive"} />,
    },
  ];

  return (
    <>
      <Card className="mt-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Zone lanes</CardTitle>
          <Button onClick={() => setEditing("new")} disabled={!zones?.length}>
            <Plus className="mr-2 h-4 w-4" />
            New lane
          </Button>
        </CardHeader>
        <CardContent>
          {isError && (
            <p className="mb-4 text-sm text-destructive">
              {error instanceof Error ? error.message : "Could not load zone lanes."}
            </p>
          )}
          <DataTable
            columns={columns}
            rows={lanes}
            isLoading={isFetching && !lanes}
            rowKey={(r) => r.id}
            onRowClick={(r) => setEditing(r)}
            emptyMessage="No lanes — every quote uses the destination zone's rate."
          />
        </CardContent>
      </Card>

      {editing !== null && (
        <ZoneLaneDialog
          lane={editing === "new" ? null : editing}
          zones={zones ?? []}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

function ZoneSelect({
  id,
  label,
  value,
  zones,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  zones: Zone[];
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder="Select a zone" />
        </SelectTrigger>
        <SelectContent>
          {zones.map((z) => (
            <SelectItem key={z.id} value={String(z.id)}>
              {z.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ZoneLaneDialog({
  lane,
  zones,
  onClose,
}: {
  lane: ZoneLane | null;
  zones: Zone[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [origin, setOrigin] = useState(lane ? String(lane.origin_zone_id) : "");
  const [destination, setDestination] = useState(lane ? String(lane.destination_zone_id) : "");
  const [firstKg, setFirstKg] = useState(lane?.first_kg ?? "");
  const [afterKg, setAfterKg] = useState(lane?.after_kg ?? "");
  const [isActive, setIsActive] = useState(lane?.is_active ?? true);
  const pairMissing = !lane && (!origin || !destination);

  const save = useMutation({
    // Decimal strings, as for zones: a price must not round-trip through a float.
    mutationFn: () =>
      lane
        ? updateZoneLane(lane.id, { first_kg: firstKg, after_kg: afterKg, is_active: isActive })
        : createZoneLane({
            origin_zone_id: Number(origin),
            destination_zone_id: Number(destination),
            first_kg: firstKg,
            after_kg: afterKg,
          }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["geo-zone-lanes"] });
      toast.success(lane ? "Lane updated" : "Lane created");
      onClose();
    },
    onError: (err) => toast.error(getErrorMessage(err, "Could not save the lane")),
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!pairMissing) save.mutate();
          }}
        >
          <DialogHeader>
            <DialogTitle>{lane ? "Edit lane" : "New zone lane"}</DialogTitle>
            <DialogDescription>
              New rates apply to quotes from now on. Confirmed quotes and booked parcels keep
              their price.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <ZoneSelect
                id="lane_origin"
                label="From zone (outlet)"
                value={origin}
                zones={zones}
                disabled={lane !== null}
                onChange={setOrigin}
              />
              <ZoneSelect
                id="lane_destination"
                label="To zone (customer)"
                value={destination}
                zones={zones}
                disabled={lane !== null}
                onChange={setDestination}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="lane_first_kg">First kg (LKR)</Label>
                <Input
                  id="lane_first_kg"
                  required
                  inputMode="decimal"
                  pattern={RATE_PATTERN}
                  value={firstKg}
                  onChange={(e) => setFirstKg(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lane_after_kg">Each kg after (LKR)</Label>
                <Input
                  id="lane_after_kg"
                  required
                  inputMode="decimal"
                  pattern={RATE_PATTERN}
                  value={afterKg}
                  onChange={(e) => setAfterKg(e.target.value)}
                />
              </div>
            </div>
            {lane && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                Active — unticking falls back to the destination zone&apos;s rate
              </label>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={save.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending || pairMissing}>
              {save.isPending ? "Saving…" : "Save lane"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
