"use client";

import { useMemo, useState } from "react";
import { MapPin, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  useAssignDispatchPickups,
  useDispatchPickups,
  usePickupPostalCities,
} from "@/lib/hooks/use-admin-dispatch";
import { useRiders } from "@/lib/hooks/use-admin-riders";
import { getErrorMessage } from "@/lib/api/client";
import { formatCurrency, formatDate } from "@/lib/format";
import type { DispatchPickup, DispatchPickupParams } from "@/types/admin-dispatch";
import { MAX_DISPATCH_BATCH } from "@/types/admin-dispatch";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type StatusKey = NonNullable<DispatchPickupParams["status_key"]>;

/**
 * Pickup dispatch board.
 *
 * Merchant parcels are grouped by the postal city of the outlet they are
 * collected from. A dispatcher picks an area, ticks its parcels and hands them
 * to one rider in a single call; the server moves them pending →
 * pickup_scheduled together or not at all.
 */
export default function AdminDispatchPage() {
  const [areaId, setAreaId] = useState<number | null>(null);
  const [statusKey, setStatusKey] = useState<StatusKey>("pending");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [riderId, setRiderId] = useState("");

  const areas = usePickupPostalCities();
  const pickups = useDispatchPickups(
    { pickup_postal_city_id: areaId ?? undefined, status_key: statusKey },
    areaId !== null
  );
  const { data: riders, isLoading: ridersLoading } = useRiders();
  const assign = useAssignDispatchPickups();

  const rows = areaId === null ? undefined : pickups.data;
  // Only a pending parcel can be handed out; re-assigning a scheduled one is a
  // different decision the server does not take through this endpoint.
  const assignable = useMemo(
    () => (rows ?? []).filter((r) => r.status_key === "pending"),
    [rows]
  );
  const area = areas.data?.find((a) => a.postal_city_id === areaId) ?? null;

  const chooseArea = (id: number) => {
    setAreaId(id);
    setSelected(new Set());
  };

  const chooseStatus = (key: StatusKey) => {
    setStatusKey(key);
    setSelected(new Set());
  };

  const toggle = (orderId: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });

  const allSelected = assignable.length > 0 && assignable.every((r) => selected.has(r.order_id));
  const toggleAll = () =>
    setSelected(
      allSelected
        ? new Set()
        : new Set(assignable.slice(0, MAX_DISPATCH_BATCH).map((r) => r.order_id))
    );

  const submit = () => {
    if (!riderId || selected.size === 0) return;
    assign.mutate(
      { order_ids: [...selected], rider_id: Number(riderId) },
      {
        onSuccess: (res) => {
          toast.success(`${res.assigned.length} pickup(s) assigned`);
          setSelected(new Set());
        },
        onError: (e) => toast.error(getErrorMessage(e, "Could not assign these pickups")),
      }
    );
  };

  const columns: Column<DispatchPickup>[] = [
    {
      header: "",
      className: "w-10",
      cell: (r) =>
        r.status_key === "pending" ? (
          <input
            type="checkbox"
            aria-label={`Select order ${r.order_id}`}
            checked={selected.has(r.order_id)}
            onChange={() => toggle(r.order_id)}
          />
        ) : null,
    },
    {
      header: "Waybill",
      cell: (r) => (
        <span className="font-medium">{r.waybill_id ?? `#${r.order_id}`}</span>
      ),
    },
    {
      header: "Merchant / outlet",
      cell: (r) => (
        <div className="text-sm">
          <div>{r.client_name ?? `#${r.client_id}`}</div>
          <div className="text-muted-foreground">
            {r.pickup_location_name ?? "—"}
            {r.pickup_contact_phone ? ` · ${r.pickup_contact_phone}` : ""}
          </div>
        </div>
      ),
    },
    {
      header: "Pickup address",
      cell: (r) => <span className="line-clamp-2 text-sm">{r.pickup_address ?? "—"}</span>,
    },
    { header: "To", cell: (r) => r.destination_postal_city ?? "—" },
    { header: "Weight", className: "text-right", cell: (r) => `${Number(r.weight_kg)} kg` },
    {
      header: "Payment",
      cell: (r) =>
        r.payment_method === "cod" ? (
          <Badge variant="outline">COD {formatCurrency(r.cod_amount)}</Badge>
        ) : (
          <Badge variant="secondary">Prepaid</Badge>
        ),
    },
    {
      header: "Charge",
      className: "text-right",
      cell: (r) => formatCurrency(r.delivery_charge),
    },
    { header: "Rider", cell: (r) => r.rider_name ?? "Unassigned" },
    { header: "Status", cell: (r) => <StatusBadge status={r.status_name} /> },
    { header: "Booked", cell: (r) => <span className="text-sm">{formatDate(r.created_at)}</span> },
  ];

  return (
    <>
      <PageHeader
        title="Pickup Dispatch"
        description="Parcels waiting to be collected, grouped by the postal city of the merchant outlet."
      />

      <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
        <Card className="h-fit">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Pickup areas</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Refresh areas"
              onClick={() => areas.refetch()}
              disabled={areas.isFetching}
            >
              <RefreshCw className="size-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {areas.isError && (
              <p className="text-sm text-destructive">Couldn&apos;t load pickup areas.</p>
            )}
            {areas.data?.length === 0 && (
              <p className="text-sm text-muted-foreground">Nothing waiting for pickup.</p>
            )}
            {areas.data?.map((a) => (
              <button
                key={a.postal_city_id}
                type="button"
                onClick={() => chooseArea(a.postal_city_id)}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-muted ${
                  a.postal_city_id === areaId ? "bg-muted font-medium" : ""
                }`}
              >
                <span className="flex items-center gap-2">
                  <MapPin className="size-4 text-muted-foreground" />
                  <span>
                    {a.name}
                    {a.district && (
                      <span className="block text-xs text-muted-foreground">{a.district}</span>
                    )}
                  </span>
                </span>
                <span className="flex gap-1">
                  {a.awaiting_rider > 0 && <Badge>{a.awaiting_rider}</Badge>}
                  {a.scheduled > 0 && <Badge variant="secondary">{a.scheduled}</Badge>}
                </span>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="flex-1 text-sm">
                {area ? (
                  <>
                    <div className="font-medium">{area.name}</div>
                    <div className="text-muted-foreground">
                      {area.awaiting_rider} awaiting a rider · {area.scheduled} scheduled
                    </div>
                  </>
                ) : (
                  <span className="text-muted-foreground">Choose a pickup area.</span>
                )}
              </div>
              <div className="w-full space-y-1 sm:w-44">
                <label className="text-xs font-medium text-muted-foreground">Show</label>
                <Select value={statusKey} onValueChange={(v) => chooseStatus(v as StatusKey)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Awaiting rider</SelectItem>
                    <SelectItem value="pickup_scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full space-y-1 sm:w-56">
                <label className="text-xs font-medium text-muted-foreground">Rider</label>
                <Select value={riderId} onValueChange={setRiderId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={ridersLoading ? "Loading…" : "Select a rider"} />
                  </SelectTrigger>
                  <SelectContent>
                    {riders
                      ?.filter((r) => r.is_active)
                      .map((r) => (
                        <SelectItem key={r.id} value={String(r.id)}>
                          {r.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={submit}
                disabled={!riderId || selected.size === 0 || assign.isPending}
              >
                {assign.isPending ? "Assigning…" : `Assign ${selected.size || ""} pickup(s)`}
              </Button>
            </CardContent>
          </Card>

          {areaId !== null && assignable.length > 0 && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              Select all awaiting a rider
              {assignable.length > MAX_DISPATCH_BATCH &&
                ` (first ${MAX_DISPATCH_BATCH} — the server takes at most ${MAX_DISPATCH_BATCH} per batch)`}
            </label>
          )}

          {pickups.isError ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Couldn&apos;t load pickups for this area.
              </CardContent>
            </Card>
          ) : (
            <DataTable
              columns={columns}
              rows={areaId === null ? [] : rows}
              isLoading={areaId !== null && pickups.isFetching && !rows}
              rowKey={(r) => r.order_id}
              emptyMessage={
                areaId === null ? "Choose a pickup area on the left." : "No pickups in this area."
              }
            />
          )}
        </div>
      </div>
    </>
  );
}
