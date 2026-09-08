"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Search, Loader2, AlarmClockOff } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useAdminSortingLayers } from "@/lib/hooks/use-admin-orders";
import { useEndOfShift, useHoldOrder, useHoldOrders } from "@/lib/hooks/use-admin-sorting";
import { getErrorMessage } from "@/lib/api/client";
import type { HoldOrderRow } from "@/types/admin-sorting";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Combobox } from "@/components/shared/combobox";

const columns: Column<HoldOrderRow>[] = [
  { header: "Waybill", cell: (r) => <span className="font-medium">{r.waybill_id}</span> },
  { header: "Client", cell: (r) => r.client_name },
  { header: "Bucket", cell: (r) => r.sorting_bucket },
  { header: "Destination", cell: (r) => r.destination_branch },
];

export function SortingHoldOrdersTab() {
  const { hasPermission } = useAuth();
  const { data: layers, isLoading: layersLoading } = useAdminSortingLayers();
  const [layerId, setLayerId] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [waybillToHold, setWaybillToHold] = useState("");

  const { data, isFetching, isError } = useHoldOrders(layerId || null, search || undefined);
  const holdMutation = useHoldOrder();
  const endOfShiftMutation = useEndOfShift();

  const layerOptions = (layers ?? []).map((l) => ({ value: String(l.key), label: l.value }));

  const submitHold = () => {
    if (!waybillToHold.trim()) return;
    holdMutation.mutate(waybillToHold.trim(), {
      onSuccess: () => {
        toast.success("Order placed on hold");
        setWaybillToHold("");
      },
      onError: (error) => toast.error(getErrorMessage(error, "Could not hold this order")),
    });
  };

  return (
    <div className="mt-4 space-y-4">
      <Card>
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1">
            <Label className="text-xs text-muted-foreground">Hold a waybill</Label>
            <Input
              placeholder="Waybill number…"
              value={waybillToHold}
              onChange={(e) => setWaybillToHold(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitHold()}
            />
          </div>
          <Button onClick={submitHold} disabled={holdMutation.isPending}>
            {holdMutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Place on hold
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-end">
          <div className="w-full space-y-1 sm:w-64">
            <Label className="text-xs text-muted-foreground">Layer</Label>
            <Combobox
              options={layerOptions}
              value={layerId}
              onChange={setLayerId}
              placeholder={layersLoading ? "Loading…" : "Select a layer"}
              searchPlaceholder="Search…"
              emptyMessage="No layer found."
              disabled={layersLoading}
            />
          </div>
          <div className="flex-1 space-y-1">
            <Label className="text-xs text-muted-foreground">Search</Label>
            <Input
              placeholder="Waybill, client, or destination…"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setSearch(searchDraft.trim())}
            />
          </div>
          <Button variant="outline" onClick={() => setSearch(searchDraft.trim())}>
            <Search className="size-4" />
            Search
          </Button>
          {hasPermission("ho-operation") && hasPermission("sorting-bucket-close") && (
            <Button
              variant="destructive"
              disabled={!layerId || endOfShiftMutation.isPending}
              onClick={() => {
                if (
                  !layerId ||
                  !window.confirm(
                    "End the night shift for this layer? This runs the sorting-process cleanup job and affects everyone, not just you."
                  )
                )
                  return;
                endOfShiftMutation.mutate(layerId, {
                  onSuccess: () => toast.success("End of shift recorded"),
                  onError: (error) =>
                    toast.error(getErrorMessage(error, "Could not end the shift")),
                });
              }}
            >
              {endOfShiftMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <AlarmClockOff className="size-4" />
              )}
              End of shift
            </Button>
          )}
        </CardContent>
      </Card>

      {isError ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Couldn&apos;t load held orders right now.
          </CardContent>
        </Card>
      ) : (
        <DataTable
          columns={columns}
          rows={data}
          isLoading={isFetching && !data}
          rowKey={(r) => r.waybill_id}
          emptyMessage={layerId ? "No orders on hold for this layer." : "Select a layer to view held orders."}
        />
      )}
    </div>
  );
}
