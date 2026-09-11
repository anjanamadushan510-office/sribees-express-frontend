"use client";

import { useState } from "react";
import { Plus, Search, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/providers/auth-provider";
import { useCities, useToggleCityStatus, useZones } from "@/lib/hooks/use-admin-locations";
import type { CityRow, ZoneRow } from "@/types/admin-location";
import { getErrorMessage } from "@/lib/api/client";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CityFormDialog } from "@/components/forms/city-form-dialog";
import { ZoneFormDialog } from "@/components/forms/zone-form-dialog";
import { PostOfficesTab } from "@/components/admin/post-offices-tab";

const PER_PAGE = 15;

export default function AdminLocationsPage() {
  return (
    <>
      <PageHeader
        title="Locations"
        description="Delivery zones price a parcel, cities group post offices, and post offices are the names merchants actually send us."
      />
      <Tabs defaultValue="post-offices">
        <TabsList>
          <TabsTrigger value="post-offices">Post offices</TabsTrigger>
          <TabsTrigger value="cities">Cities</TabsTrigger>
          <TabsTrigger value="zones">Zones</TabsTrigger>
        </TabsList>
        <TabsContent value="post-offices">
          <PostOfficesTab />
        </TabsContent>
        <TabsContent value="cities">
          <CitiesTab />
        </TabsContent>
        <TabsContent value="zones">
          <ZonesTab />
        </TabsContent>
      </Tabs>
    </>
  );
}

function CitiesTab() {
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data, isFetching, isError } = useCities({
    page,
    perPage: PER_PAGE,
    city_name: appliedSearch || undefined,
  });
  const toggleMutation = useToggleCityStatus();

  const openCreate = () => {
    setEditingId(null);
    setDialogOpen(true);
  };
  const openEdit = (row: CityRow) => {
    setEditingId(row.id);
    setDialogOpen(true);
  };

  const columns: Column<CityRow>[] = [
    { header: "City", cell: (r) => <span className="font-medium">{r.city}</span> },
    { header: "District", cell: (r) => r.district ?? "—" },
    { header: "Zone", cell: (r) => r.zone ?? "—" },
    { header: "Branch", cell: (r) => r.branch ?? "—" },
    { header: "Postcode", cell: (r) => r.postcode ?? "—" },
    { header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
    {
      header: "",
      className: "text-right",
      cell: (r) =>
        hasPermission("active-city") || hasPermission("deactivate-city") ? (
          <Button
            size="sm"
            variant="outline"
            disabled={toggleMutation.isPending}
            onClick={(e) => {
              e.stopPropagation();
              toggleMutation.mutate(
                { id: r.id, isActive: r.status.toLowerCase() !== "active" },
                {
                  onSuccess: () => toast.success("City status updated"),
                  onError: (error) =>
                    toast.error(getErrorMessage(error, "Could not update status")),
                }
              );
            }}
          >
            {r.status.toLowerCase() === "active" ? "Deactivate" : "Activate"}
          </Button>
        ) : null,
    },
  ];

  return (
    <>
      <Card className="mb-4 mt-4">
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">City name</label>
            <Input
              placeholder="Search city…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setAppliedSearch(search.trim());
                  setPage(1);
                }
              }}
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setAppliedSearch(search.trim());
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
                setAppliedSearch("");
                setPage(1);
              }}
            >
              <RotateCcw className="size-4" />
              Reset
            </Button>
            {hasPermission("create-city") && (
              <Button onClick={openCreate}>
                <Plus className="size-4" />
                New City
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {isError ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Couldn&apos;t load cities right now. Check your connection and try again.
          </CardContent>
        </Card>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data?.items}
            isLoading={isFetching && !data}
            rowKey={(r) => r.id}
            onRowClick={hasPermission("edit-city") ? openEdit : undefined}
            emptyMessage="No cities found."
          />
          <Pagination
            pagination={data?.pagination}
            onPageChange={setPage}
            isLoading={isFetching}
          />
        </>
      )}

      <CityFormDialog open={dialogOpen} onOpenChange={setDialogOpen} cityId={editingId} />
    </>
  );
}

function ZonesTab() {
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data, isFetching, isError } = useZones({
    page,
    perPage: PER_PAGE,
    zone_name: appliedSearch || undefined,
  });

  const openCreate = () => {
    setEditingId(null);
    setDialogOpen(true);
  };
  const openEdit = (row: ZoneRow) => {
    setEditingId(row.id);
    setDialogOpen(true);
  };

  const columns: Column<ZoneRow>[] = [
    { header: "Zone", cell: (r) => <span className="font-medium">{r.name}</span> },
    { header: "1st KG", className: "text-right", cell: (r) => r.delivery_start_kg },
    { header: "After KG", className: "text-right", cell: (r) => r.delivery_additional_kg },
    { header: "Return 1st KG", className: "text-right", cell: (r) => r.return_start_kg },
    {
      header: "Return after KG",
      className: "text-right",
      cell: (r) => r.return_additional_kg,
    },
    { header: "Weight margin", className: "text-right", cell: (r) => r.margin_kg },
  ];

  return (
    <>
      <Card className="mb-4 mt-4">
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Zone name</label>
            <Input
              placeholder="Search zone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setAppliedSearch(search.trim());
                  setPage(1);
                }
              }}
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setAppliedSearch(search.trim());
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
                setAppliedSearch("");
                setPage(1);
              }}
            >
              <RotateCcw className="size-4" />
              Reset
            </Button>
            {hasPermission("create-zone") && (
              <Button onClick={openCreate}>
                <Plus className="size-4" />
                New Zone
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {isError ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Couldn&apos;t load zones right now. Check your connection and try again.
          </CardContent>
        </Card>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data?.items}
            isLoading={isFetching && !data}
            rowKey={(r) => r.id}
            onRowClick={hasPermission("edit-zone") ? openEdit : undefined}
            emptyMessage="No zones found."
          />
          <Pagination
            pagination={data?.pagination}
            onPageChange={setPage}
            isLoading={isFetching}
          />
        </>
      )}

      <ZoneFormDialog open={dialogOpen} onOpenChange={setDialogOpen} zoneId={editingId} />
    </>
  );
}
