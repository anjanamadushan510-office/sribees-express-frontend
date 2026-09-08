"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, PackagePlus } from "lucide-react";
import { useAdminSortingLayers } from "@/lib/hooks/use-admin-orders";
import { useCreateBag, useCurrentBag } from "@/lib/hooks/use-admin-sorting";
import { getErrorMessage } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Combobox } from "@/components/shared/combobox";

export function SortingBagsTab() {
  const { data: layers, isLoading: layersLoading } = useAdminSortingLayers();
  const [layerId, setLayerId] = useState("");

  const { data: bag, isLoading, isError } = useCurrentBag(layerId || null);
  const createMutation = useCreateBag();

  const layerOptions = (layers ?? []).map((l) => ({ value: String(l.key), label: l.value }));

  const startNewBag = () => {
    if (!layerId) return;
    createMutation.mutate(Number(layerId), {
      onSuccess: () => toast.success("New bag started"),
      onError: (error) => toast.error(getErrorMessage(error, "Could not start a new bag")),
    });
  };

  return (
    <div className="mt-4 space-y-4">
      <Card>
        <CardContent className="pt-6">
          <Label className="mb-1.5 block text-xs text-muted-foreground">
            Final sorting layer
          </Label>
          <div className="max-w-sm">
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
        </CardContent>
      </Card>

      {!layerId ? (
        <p className="text-sm text-muted-foreground">
          Select a layer to see the current bag being filled for it.
        </p>
      ) : isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : isError ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Couldn&apos;t load the current bag right now.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="space-y-3 pt-6">
            {bag ? (
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Reference</dt>
                  <dd className="font-medium">{bag.ref_id}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Items</dt>
                  <dd className="font-medium">{bag.items_count ?? 0}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Opened</dt>
                  <dd>{formatDate(bag.created_at)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Status</dt>
                  <dd>{bag.closed_at ? "Closed" : "Open"}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">
                No active bag for this layer yet — this requires an open sorting bucket
                (see the Buckets tab).
              </p>
            )}
            <Button onClick={startNewBag} disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <PackagePlus className="size-4" />
              )}
              Start new bag
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
