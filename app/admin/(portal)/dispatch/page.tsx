"use client";

import { useMemo, useState } from "react";
import { MapPin, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  useAssignDispatchPickups,
  useDispatchPickups,
  usePickupPostalCities,
} from "@/lib/hooks/use-admin-dispatch";
import { useAdminOrders } from "@/lib/hooks/use-admin-orders";
import { useAssignRiderToOrder, useRiders } from "@/lib/hooks/use-admin-riders";
import { useGeoBranches } from "@/lib/hooks/use-geo";
import { getErrorMessage } from "@/lib/api/client";
import { formatCurrency, formatDate } from "@/lib/format";
import type { DispatchPickup, DispatchPickupParams } from "@/types/admin-dispatch";
import { MAX_DISPATCH_BATCH } from "@/types/admin-dispatch";
import type { ClientOrder } from "@/types/order";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type StatusKey = NonNullable<DispatchPickupParams["status_key"]>;

export default function AdminDispatchPage() {
  return (
    <>
      <PageHeader
        title="Dispatch"
        description="Send a rider to collect a merchant's parcels, or hand a cross-zone parcel to a local rider once it reaches its branch."
      />
      <Tabs defaultValue="pickups">
        <TabsList>
          <TabsTrigger value="pickups">Pickups</TabsTrigger>
          <TabsTrigger value="branch-handoff">Branch handoff</TabsTrigger>
        </TabsList>
        <TabsContent value="pickups">
          <PickupDispatchTab />
        </TabsContent>
        <TabsContent value="branch-handoff">
          <BranchHandoffTab />
        </TabsContent>
      </Tabs>
    </>
  );
}

/**
 * Pickup dispatch board.
 *
 * Merchant parcels are grouped by the postal city of the outlet they are
 * collected from. A dispatcher picks an area, ticks its parcels and hands them
 * to one rider in a single call; the server moves them pending →
 * pickup_scheduled together or not at all.
 */
function PickupDispatchTab() {
  const [areaId, setAreaId] = useState<number | null>(null);
  const [statusKey, setStatusKey] = useState<StatusKey>("pending");
  // "" means both. Returns are a minority of this board and a dispatcher
  // planning a run of them should not have to read every row to find them.
  const [kind, setKind] = useState<"" | "forward" | "return">("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [riderId, setRiderId] = useState("");

  const areas = usePickupPostalCities();
  const pickups = useDispatchPickups(
    {
      pickup_postal_city_id: areaId ?? undefined,
      status_key: statusKey,
      order_kind: kind || undefined,
    },
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

  const chooseKind = (next: "" | "forward" | "return") => {
    setKind(next);
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
        <div>
          <span className="font-medium">{r.waybill_id ?? `#${r.order_id}`}</span>
          {r.order_kind === "return" && (
            <span className="ml-2 rounded-full border border-violet-400/50 bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-violet-600 dark:text-violet-400">
              RETURN
            </span>
          )}
          {/* The SXR number exists only in our system; this is the one on the
              label, which is what a dispatcher reconciles against paper. */}
          {r.parent_waybill_id && (
            <div className="text-xs text-muted-foreground">for {r.parent_waybill_id}</div>
          )}
        </div>
      ),
    },
    {
      header: "Collect from",
      cell: (r) => (
        <div className="text-sm">
          {/* On a return the person at the door is the customer and the
              merchant is who it goes back to. Printing it the usual way round
              sends a rider expecting a shop counter. */}
          <div>
            {r.order_kind === "return"
              ? (r.pickup_location_name ?? "Customer")
              : (r.client_name ?? `#${r.client_id}`)}
          </div>
          <div className="text-muted-foreground">
            {r.order_kind === "return"
              ? `back to ${r.client_name ?? `#${r.client_id}`}`
              : (r.pickup_location_name ?? "—")}
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
      <p className="mb-4 text-sm text-muted-foreground">
        Parcels waiting to be collected, grouped by the postal city they are collected from — a merchant outlet, or a customer&apos;s door when the goods are going back.
      </p>

      {/* Top Row: Pickup Areas + Dispatch Controls */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Pickup Areas Card */}
        <Card className="flex flex-col justify-between lg:col-span-5">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Pickup areas</CardTitle>
              <p className="text-xs text-muted-foreground">Select a city to view pickups</p>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              aria-label="Refresh areas"
              onClick={() => areas.refetch()}
              disabled={areas.isFetching}
            >
              <RefreshCw className={`size-4 ${areas.isFetching ? "animate-spin" : ""}`} />
            </Button>
          </CardHeader>
          <CardContent className="max-h-56 flex-1 space-y-1 overflow-y-auto pr-1">
            {areas.isError && (
              <p className="py-2 text-sm text-destructive">Couldn&apos;t load pickup areas.</p>
            )}
            {areas.data?.length === 0 && (
              <p className="py-2 text-sm text-muted-foreground">Nothing waiting for pickup.</p>
            )}
            {areas.data?.map((a) => (
              <button
                key={a.postal_city_id}
                type="button"
                onClick={() => chooseArea(a.postal_city_id)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
                  a.postal_city_id === areaId
                    ? "border border-border bg-accent/80 font-medium text-accent-foreground"
                    : "text-muted-foreground"
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <MapPin
                    className={`size-4 shrink-0 ${
                      a.postal_city_id === areaId ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  <span className="truncate">
                    <span className="font-medium text-foreground">{a.name}</span>
                    {a.district && (
                      <span className="block truncate text-xs text-muted-foreground">
                        {a.district}
                      </span>
                    )}
                  </span>
                </span>
                <span className="ml-2 flex shrink-0 items-center gap-1.5">
                  {a.awaiting_rider > 0 && <Badge variant="default" className="text-xs">{a.awaiting_rider}</Badge>}
                  {a.scheduled > 0 && <Badge variant="secondary" className="text-xs">{a.scheduled}</Badge>}
                </span>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Dispatch Actions & Filters Card */}
        <Card className="flex flex-col justify-between lg:col-span-7">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Dispatch Actions</CardTitle>
              {area && (
                <Badge variant="outline" className="text-xs font-normal">
                  {area.name} selected
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {area ? (
                <span>
                  <strong className="text-foreground">{area.awaiting_rider}</strong> awaiting rider ·{" "}
                  <strong className="text-foreground">{area.scheduled}</strong> scheduled
                </span>
              ) : (
                <span>Please choose a pickup area from the list to filter and assign riders.</span>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Row 1: Show Status & Job Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Show Status</label>
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

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Job Type</label>
                <Select
                  value={kind === "" ? "all" : kind}
                  onValueChange={(v) => chooseKind(v === "all" ? "" : (v as "forward" | "return"))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="forward">Merchant pickups</SelectItem>
                    <SelectItem value="return">Returns</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Row 2: Assign Rider & Assign Button */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Assign Rider</label>
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

              <div className="flex items-end">
                <Button
                  onClick={submit}
                  disabled={!riderId || selected.size === 0 || assign.isPending}
                  className="w-full"
                >
                  {assign.isPending ? "Assigning…" : `Assign ${selected.size || ""} Pickup(s)`}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Select All & DataTable */}
      <div className="space-y-3">
        {areaId !== null && assignable.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-card px-4 py-2.5 text-sm shadow-sm">
            <label className="flex cursor-pointer items-center gap-2 font-medium">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span>Select all awaiting a rider</span>
              <span className="text-xs font-normal text-muted-foreground">
                ({selected.size} selected)
              </span>
            </label>
            {assignable.length > MAX_DISPATCH_BATCH && (
              <span className="text-xs text-muted-foreground">
                Batch limit: Max {MAX_DISPATCH_BATCH} pickups per assignment
              </span>
            )}
          </div>
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
              areaId === null ? "Choose a pickup area above." : "No pickups in this area."
            }
          />
        )}
      </div>
    </>
  );
}

/**
 * Branch handoff board — the other side of the zone-aware routing rules in
 * `transition_order_status`. A cross-zone parcel arrives at
 * `received_at_destination` with a resolved `current_branch_id` and no rider
 * (the collecting rider was cleared off it); this is where a local rider is
 * assigned so it can move on to `out_for_delivery`. Same
 * `POST /fleet/orders/{id}/assign-rider` call the Pickups tab already uses,
 * one order at a time rather than a batch — a branch handoff is a trickle,
 * not a morning rush.
 */
function BranchHandoffTab() {
  const [branchId, setBranchId] = useState<string>("");
  const { data: branches } = useGeoBranches();
  const { data: riders, isLoading: ridersLoading } = useRiders();
  const [riderSelection, setRiderSelection] = useState<Record<number, string>>({});
  const assign = useAssignRiderToOrder();

  const { data: page, isFetching, isError } = useAdminOrders({
    status_key: "received_at_destination",
    branch_id: branchId ? Number(branchId) : undefined,
    limit: 100,
  });
  const orders = branchId ? page?.items : undefined;

  async function handAssign(order: ClientOrder) {
    const riderId = riderSelection[order.id];
    if (!riderId) return;
    try {
      await assign.mutateAsync({ orderId: order.id, riderId: Number(riderId) });
      toast.success(`${order.waybill_id ?? `#${order.id}`} handed to a rider`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not assign a rider"));
    }
  }

  const columns: Column<ClientOrder>[] = [
    {
      header: "Waybill",
      cell: (r) => <span className="font-medium">{r.waybill_id ?? `#${r.id}`}</span>,
    },
    { header: "Recipient", cell: (r) => r.recipient_name },
    { header: "Address", cell: (r) => <span className="line-clamp-2 text-sm">{r.recipient_address}</span> },
    { header: "Weight", className: "text-right", cell: (r) => `${Number(r.weight_kg)} kg` },
    { header: "Charge", className: "text-right", cell: (r) => formatCurrency(r.delivery_charge) },
    {
      header: "Assign to",
      cell: (r) => (
        <div className="flex items-center gap-2">
          <Select
            value={riderSelection[r.id] ?? ""}
            onValueChange={(value) => setRiderSelection((s) => ({ ...s, [r.id]: value }))}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder={ridersLoading ? "Loading…" : "Rider"} />
            </SelectTrigger>
            <SelectContent>
              {riders
                ?.filter((rider) => rider.is_active)
                .map((rider) => (
                  <SelectItem key={rider.id} value={String(rider.id)}>
                    {rider.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            disabled={!riderSelection[r.id] || assign.isPending}
            onClick={() => handAssign(r)}
          >
            Assign
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-end">
          <div className="w-full space-y-1 sm:w-64">
            <label className="text-xs font-medium text-muted-foreground">Branch</label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a branch" />
              </SelectTrigger>
              <SelectContent>
                {(branches ?? []).map((branch) => (
                  <SelectItem key={branch.id} value={String(branch.id)}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isError ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Couldn&apos;t load parcels waiting at this branch.
          </CardContent>
        </Card>
      ) : (
        <DataTable
          columns={columns}
          rows={orders}
          isLoading={branchId !== "" && isFetching && !orders}
          rowKey={(r) => r.id}
          emptyMessage={
            branchId === ""
              ? "Choose a branch to see parcels waiting for a local rider."
              : "Nothing waiting at this branch."
          }
        />
      )}
    </>
  );
}
