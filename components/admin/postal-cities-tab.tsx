"use client";

import { useMemo, useState } from "react";
import { RotateCcw, Search } from "lucide-react";
import { useGeoBranches, useGeoZones, usePostalCities, usePostalCityRegions } from "@/lib/hooks/use-geo";
import type { PostalCity } from "@/types/admin-geo";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL = "__all__";
const NONE = "__none__";
const PER_PAGE = 50;

/**
 * Rolling delivery out across the national postal city directory.
 *
 * Every one of the 2,111 postal cities is seeded, and none is delivered to
 * until it has a zone (which prices it) and a branch covers it (which routes
 * it). An unzoned postal city is left out of the merchant API's list and
 * refused as an order destination, so the "Rollout by district" card grid
 * below is read-only progress, not an action screen: pricing is set from a
 * zone's own editor and coverage from a branch's own editor (both search
 * postal cities directly, no district step), leaving this screen to answer
 * "where is the rollout at" rather than also be a second place to make either
 * assignment.
 */
export function PostalCitiesTab() {
  const [province, setProvince] = useState<string>(ALL);
  const [district, setDistrict] = useState<string>(ALL);
  const [zoneFilter, setZoneFilter] = useState<string>(ALL);
  const [branchFilter, setBranchFilter] = useState<string>(ALL);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);

  const { data: regions } = usePostalCityRegions();
  const { data: zones } = useGeoZones();
  const { data: branches } = useGeoBranches();

  const { data, isFetching, isError, error } = usePostalCities({
    search: search || undefined,
    province: province === ALL ? undefined : province,
    district: district === ALL ? undefined : district,
    zone_id: zoneFilter === ALL || zoneFilter === NONE ? undefined : Number(zoneFilter),
    zoned: zoneFilter === NONE ? false : undefined,
    branch_id: branchFilter === ALL ? undefined : Number(branchFilter),
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
  const zoneName = useMemo(() => {
    const byId = new Map((zones ?? []).map((z) => [z.id, z.name]));
    return (id: number | null) => (id === null ? null : byId.get(id) ?? `#${id}`);
  }, [zones]);

  const totals = useMemo(() => {
    const rows = regions ?? [];
    return {
      total: rows.reduce((sum, r) => sum + r.total, 0),
      zoned: rows.reduce((sum, r) => sum + r.zoned, 0),
      covered: rows.reduce((sum, r) => sum + r.covered, 0),
    };
  }, [regions]);

  const columns: Column<PostalCity>[] = [
    { header: "Postal city", cell: (r) => <span className="font-medium">{r.name}</span> },
    { header: "District", cell: (r) => r.district ?? "—" },
    { header: "Province", cell: (r) => r.province ?? "—" },
    {
      header: "Zone",
      cell: (r) =>
        zoneName(r.zone_id) ?? <span className="text-muted-foreground">Not delivered</span>,
    },
    {
      header: "Branch",
      cell: (r) =>
        r.branches.length > 0 ? (
          r.branches.map((b) => b.name).join(", ")
        ) : (
          <span className="text-muted-foreground">Uncovered</span>
        ),
    },
  ];

  function reset() {
    setProvince(ALL);
    setDistrict(ALL);
    setZoneFilter(ALL);
    setBranchFilter(ALL);
    setSearchInput("");
    setSearch("");
    setOffset(0);
  }

  return (
    <>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Rollout by district</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {totals.zoned.toLocaleString()} of {totals.total.toLocaleString()} postal cities
            are priced, and {totals.covered.toLocaleString()} are covered by a branch. Price a
            zone or assign a branch from that zone&apos;s or branch&apos;s own editor.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(regions ?? []).map((region) => {
              const ready = region.zoned === region.total && region.covered === region.total;
              return (
                <div
                  key={`${region.province}-${region.district}`}
                  className="flex items-center justify-between rounded-lg border p-3 text-sm"
                >
                  <div>
                    <div className="font-medium">{region.district}</div>
                    <div className="text-xs text-muted-foreground">{region.province}</div>
                  </div>
                  <div
                    className={
                      ready
                        ? "text-right text-xs font-medium text-emerald-600"
                        : "text-right text-xs text-muted-foreground"
                    }
                  >
                    <div>
                      {region.zoned}/{region.total} priced
                    </div>
                    <div>
                      {region.covered}/{region.total} covered
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
          <div className="relative flex-1 lg:min-w-56">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Postal city name"
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
          <FilterSelect
            value={province}
            onChange={(v) => {
              setProvince(v);
              setDistrict(ALL);
              setOffset(0);
            }}
            allLabel="Any province"
            options={provinces.map((p) => ({ value: p, label: p }))}
          />
          <FilterSelect
            value={district}
            onChange={(v) => {
              setDistrict(v);
              setOffset(0);
            }}
            allLabel="Any district"
            options={districts.map((d) => ({ value: d, label: d }))}
          />
          <FilterSelect
            value={zoneFilter}
            onChange={(v) => {
              setZoneFilter(v);
              setOffset(0);
            }}
            allLabel="Any zone"
            options={[
              { value: NONE, label: "Not delivered" },
              ...(zones ?? []).map((z) => ({ value: String(z.id), label: z.name })),
            ]}
          />
          <FilterSelect
            value={branchFilter}
            onChange={(v) => {
              setBranchFilter(v);
              setOffset(0);
            }}
            allLabel="Any branch"
            options={(branches ?? []).map((b) => ({ value: String(b.id), label: b.name }))}
          />
          <Button variant="outline" onClick={reset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </CardContent>
      </Card>

      {isError && (
        <p className="mb-4 text-sm text-destructive">
          {error instanceof Error ? error.message : "Could not load postal cities."}
        </p>
      )}

      <DataTable
        columns={columns}
        rows={data?.items}
        isLoading={isFetching && !data}
        rowKey={(r) => r.id}
        emptyMessage="No postal cities match these filters."
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
    </>
  );
}

function FilterSelect({
  value,
  onChange,
  allLabel,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  allLabel: string;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="lg:w-44">
        <SelectValue placeholder={allLabel} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{allLabel}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
