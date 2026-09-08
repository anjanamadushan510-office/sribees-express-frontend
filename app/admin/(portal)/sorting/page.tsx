"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Search, RotateCcw, Loader2 } from "lucide-react";
import { useCityAssignOrders, useSortingCount, useUpdateOrderCity } from "@/lib/hooks/use-admin-sorting";
import { useAdminCities } from "@/lib/hooks/use-admin-orders";
import type { CityAssignRow, SortingCountRow } from "@/types/admin-sorting";
import { getErrorMessage } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Combobox } from "@/components/shared/combobox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SortingBucketsTab } from "@/components/admin/sorting-buckets-tab";
import { SortingHoldOrdersTab } from "@/components/admin/sorting-hold-orders-tab";
import { SortingDeviceSettingsTab } from "@/components/admin/sorting-device-settings-tab";
import { SortingBagsTab } from "@/components/admin/sorting-bags-tab";

const PER_PAGE = 15;

export default function AdminSortingPage() {
  return (
    <>
      <PageHeader
        title="Sorting"
        description="Sorting-center throughput, scanning-station buckets, and warehouse-floor tooling."
      />
      <SortingCountSection />

      <Tabs defaultValue="city">
        <TabsList>
          <TabsTrigger value="city">City Confirmation</TabsTrigger>
          <TabsTrigger value="buckets">Buckets</TabsTrigger>
          <TabsTrigger value="hold">Hold Orders</TabsTrigger>
          <TabsTrigger value="devices">Device Settings</TabsTrigger>
          <TabsTrigger value="bags">Bags</TabsTrigger>
        </TabsList>
        <TabsContent value="city">
          <div className="mt-4">
            <CityAssignSection />
          </div>
        </TabsContent>
        <TabsContent value="buckets">
          <SortingBucketsTab />
        </TabsContent>
        <TabsContent value="hold">
          <SortingHoldOrdersTab />
        </TabsContent>
        <TabsContent value="devices">
          <SortingDeviceSettingsTab />
        </TabsContent>
        <TabsContent value="bags">
          <SortingBagsTab />
        </TabsContent>
      </Tabs>
    </>
  );
}

function SortingCountSection() {
  const { data, isLoading, isError } = useSortingCount({});

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-base">Sorting-center throughput</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : isError ? (
          <p className="text-sm text-muted-foreground">
            Couldn&apos;t load sorting counts right now.
          </p>
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sorting activity recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs font-medium text-muted-foreground">
                  <th className="py-2 pr-4">Sorting center</th>
                  <th className="py-2 pr-4">Destination warehouse</th>
                  <th className="py-2 pr-4 text-right">Collected</th>
                  <th className="py-2 pr-4 text-right">Dispatched</th>
                  <th className="py-2 text-right">Pending</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r: SortingCountRow, i: number) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2 pr-4">{r.scanned_at_sorting_center ?? "—"}</td>
                    <td className="py-2 pr-4">{r.destination_warehouse ?? "—"}</td>
                    <td className="py-2 pr-4 text-right">{r.collected_at_sorting_center}</td>
                    <td className="py-2 pr-4 text-right">{r.collect_and_dispatchs}</td>
                    <td className="py-2 text-right">{r.pending_orders}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CityAssignSection() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState("");
  const [assigningWaybill, setAssigningWaybill] = useState<string | null>(null);

  const { data, isFetching, isError } = useCityAssignOrders({
    page,
    perPage: PER_PAGE,
    waybill_id: applied || undefined,
  });

  const columns: Column<CityAssignRow>[] = [
    { header: "Waybill", cell: (r) => <span className="font-medium">{r.waybill_id}</span> },
    { header: "Client", cell: (r) => r.client_name ?? "—" },
    { header: "Address", cell: (r) => r.delivery_address ?? "—" },
    { header: "Suggested city", cell: (r) => r.suggested_city ?? "—" },
    { header: "Order date", cell: (r) => formatDate(r.order_date) },
    {
      header: "",
      className: "text-right",
      cell: (r) => (
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            setAssigningWaybill(r.waybill_id);
          }}
        >
          Assign city
        </Button>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">City confirmation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Waybill</label>
            <Input
              placeholder="Search waybill…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setApplied(search.trim());
                  setPage(1);
                }
              }}
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setApplied(search.trim());
                setPage(1);
              }}
            >
              <Search className="size-4" />
              Search
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setApplied("");
                setPage(1);
              }}
            >
              <RotateCcw className="size-4" />
              Reset
            </Button>
          </div>
        </div>

        {isError ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Couldn&apos;t load orders right now. Check your connection and try again.
          </p>
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={data?.items}
              isLoading={isFetching && !data}
              rowKey={(r) => r.id}
              emptyMessage="No orders awaiting city confirmation."
            />
            <Pagination
              pagination={data?.pagination}
              onPageChange={setPage}
              isLoading={isFetching}
            />
          </>
        )}
      </CardContent>

      <AssignCityDialog
        waybillId={assigningWaybill}
        onOpenChange={(open) => !open && setAssigningWaybill(null)}
      />
    </Card>
  );
}

function AssignCityDialog({
  waybillId,
  onOpenChange,
}: {
  waybillId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: cities, isLoading: citiesLoading } = useAdminCities();
  const [cityId, setCityId] = useState("");
  const mutation = useUpdateOrderCity();

  const cityOptions = (cities ?? []).map((c) => ({ value: String(c.key), label: c.value }));

  const submit = () => {
    if (!waybillId || !cityId) return;
    mutation.mutate(
      { waybill_id: waybillId, city_id: Number(cityId) },
      {
        onSuccess: () => {
          toast.success("City assigned");
          setCityId("");
          onOpenChange(false);
        },
        onError: (error) => toast.error(getErrorMessage(error, "Could not assign city")),
      }
    );
  };

  return (
    <Dialog open={waybillId !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign city — {waybillId}</DialogTitle>
        </DialogHeader>
        <Combobox
          options={cityOptions}
          value={cityId}
          onChange={setCityId}
          placeholder={citiesLoading ? "Loading…" : "Select city"}
          searchPlaceholder="Search city…"
          emptyMessage="No city found."
          disabled={citiesLoading}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!cityId || mutation.isPending} onClick={submit}>
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
