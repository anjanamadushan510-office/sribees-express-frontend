"use client";

import { useMemo, useState } from "react";
import { RotateCcw, Search } from "lucide-react";
import { toast } from "sonner";
import {
  useAssignPostOffices,
  useGeoCities,
  usePostOfficeRegions,
  usePostOffices,
} from "@/lib/hooks/use-geo";
import type { PostOffice, PostOfficeRegion } from "@/types/admin-geo";
import { getErrorMessage } from "@/lib/api/client";
import { DataTable, type Column } from "@/components/shared/data-table";
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

const ALL = "__all__";
const UNASSIGNED = "__unassigned__";
const PER_PAGE = 50;

/**
 * Assigning the national post office directory to delivery cities.
 *
 * A merchant sends us a post office name; `/ecommerce/locations/resolve` turns
 * it into a city, and answers "not yet configured" for any post office nobody
 * has attached to one. That makes this screen the thing standing between a
 * seeded directory and an address the API can actually quote — so it leads with
 * per-district progress rather than an alphabetical list of 2,111 rows.
 */
export function PostOfficesTab() {
  const [province, setProvince] = useState<string>(ALL);
  const [district, setDistrict] = useState<string>(ALL);
  const [cityFilter, setCityFilter] = useState<string>(ALL);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [assigningRegion, setAssigningRegion] = useState<PostOfficeRegion | null>(null);

  const { data: regions } = usePostOfficeRegions();
  const { data: cities } = useGeoCities();
  const assigned =
    cityFilter === ALL ? undefined : cityFilter === UNASSIGNED ? false : undefined;

  const { data, isFetching, isError, error } = usePostOffices({
    search: search || undefined,
    province: province === ALL ? undefined : province,
    district: district === ALL ? undefined : district,
    city_id:
      cityFilter === ALL || cityFilter === UNASSIGNED ? undefined : Number(cityFilter),
    assigned,
    limit: PER_PAGE,
    offset,
  });

  const provinces = useMemo(
    () => [...new Set((regions ?? []).map((r) => r.province))].sort(),
    [regions]
  );
  const districts = useMemo(
    () =>
      (regions ?? [])
        .filter((r) => province === ALL || r.province === province)
        .map((r) => r.district)
        .sort(),
    [regions, province]
  );
  const cityName = useMemo(() => {
    const byId = new Map((cities ?? []).map((c) => [c.id, c.name]));
    return (id: number | null) => (id === null ? null : byId.get(id) ?? `#${id}`);
  }, [cities]);

  const totals = useMemo(() => {
    const rows = regions ?? [];
    return {
      total: rows.reduce((sum, r) => sum + r.total, 0),
      assigned: rows.reduce((sum, r) => sum + r.assigned, 0),
    };
  }, [regions]);

  const columns: Column<PostOffice>[] = [
    { header: "Post office", cell: (r) => <span className="font-medium">{r.name}</span> },
    { header: "District", cell: (r) => r.district ?? "—" },
    { header: "Province", cell: (r) => r.province ?? "—" },
    {
      header: "Delivery city",
      cell: (r) =>
        cityName(r.city_id) ?? (
          <span className="text-muted-foreground">Not configured</span>
        ),
    },
  ];

  function reset() {
    setProvince(ALL);
    setDistrict(ALL);
    setCityFilter(ALL);
    setSearchInput("");
    setSearch("");
    setOffset(0);
  }

  return (
    <>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Coverage by district</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {totals.assigned.toLocaleString()} of {totals.total.toLocaleString()} post
            offices are attached to a delivery city. The rest resolve as
            &ldquo;not yet configured&rdquo; for merchants.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(regions ?? []).map((region) => {
              const complete = region.assigned === region.total;
              return (
                <button
                  key={`${region.province}-${region.district}`}
                  type="button"
                  onClick={() => setAssigningRegion(region)}
                  className="flex items-center justify-between rounded-lg border p-3 text-left text-sm transition-colors hover:bg-accent"
                >
                  <div>
                    <div className="font-medium">{region.district}</div>
                    <div className="text-xs text-muted-foreground">
                      {region.province}
                    </div>
                  </div>
                  <span
                    className={
                      complete
                        ? "text-xs font-medium text-emerald-600"
                        : "text-xs text-muted-foreground"
                    }
                  >
                    {region.assigned}/{region.total}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 pt-6 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Post office name"
              className="pl-9"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setSearch(searchInput.trim());
                  setOffset(0);
                }
              }}
            />
          </div>
          <Select
            value={province}
            onValueChange={(v) => {
              setProvince(v);
              setDistrict(ALL);
              setOffset(0);
            }}
          >
            <SelectTrigger className="lg:w-52">
              <SelectValue placeholder="Any province" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Any province</SelectItem>
              {provinces.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={district}
            onValueChange={(v) => {
              setDistrict(v);
              setOffset(0);
            }}
          >
            <SelectTrigger className="lg:w-48">
              <SelectValue placeholder="Any district" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Any district</SelectItem>
              {districts.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={cityFilter}
            onValueChange={(v) => {
              setCityFilter(v);
              setOffset(0);
            }}
          >
            <SelectTrigger className="lg:w-52">
              <SelectValue placeholder="Any city" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Any city</SelectItem>
              <SelectItem value={UNASSIGNED}>Not configured</SelectItem>
              {(cities ?? []).map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={reset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </CardContent>
      </Card>

      {isError && (
        <p className="mb-4 text-sm text-destructive">
          {error instanceof Error ? error.message : "Could not load post offices."}
        </p>
      )}

      <DataTable
        columns={columns}
        rows={data?.items}
        isLoading={isFetching && !data}
        rowKey={(r) => r.id}
        emptyMessage="No post offices match these filters."
      />

      {data && (
        <div className="flex items-center justify-between px-1 py-3 text-sm text-muted-foreground">
          <span>
            {data.total === 0
              ? "No results"
              : `${data.offset + 1}–${data.offset + data.items.length} of ${data.total.toLocaleString()}`}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={data.offset === 0 || isFetching}
              onClick={() => setOffset(Math.max(0, data.offset - PER_PAGE))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={data.offset + data.items.length >= data.total || isFetching}
              onClick={() => setOffset(data.offset + PER_PAGE)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <AssignRegionDialog
        region={assigningRegion}
        cities={cities ?? []}
        onClose={() => setAssigningRegion(null)}
      />
    </>
  );
}

function AssignRegionDialog({
  region,
  cities,
  onClose,
}: {
  region: PostOfficeRegion | null;
  cities: { id: number; name: string }[];
  onClose: () => void;
}) {
  const [cityId, setCityId] = useState<string>("");
  const assign = useAssignPostOffices();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!region) return;
    try {
      const result = await assign.mutateAsync({
        city_id: cityId === UNASSIGNED ? null : Number(cityId),
        district: region.district,
        province: region.province,
      });
      toast.success(
        cityId === UNASSIGNED
          ? `${result.updated} post offices detached`
          : `${result.updated} post offices in ${region.district} assigned`
      );
      setCityId("");
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not assign the district"));
    }
  }

  return (
    <Dialog
      open={region !== null}
      onOpenChange={(open) => {
        if (!open) {
          setCityId("");
          onClose();
        }
      }}
    >
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Assign {region?.district}</DialogTitle>
            <DialogDescription>
              Every post office in {region?.district} ({region?.total}) moves to the
              chosen city. This overwrites any city already set within the district.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <Label htmlFor="assign_city">Delivery city</Label>
            <Select value={cityId} onValueChange={setCityId}>
              <SelectTrigger id="assign_city">
                <SelectValue placeholder="Choose a city" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED}>Detach (not configured)</SelectItem>
                {cities.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={assign.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={assign.isPending || cityId === ""}>
              {assign.isPending ? "Assigning…" : "Assign district"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
