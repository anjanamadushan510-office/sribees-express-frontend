"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Play, Plus, ScanLine, Trash2, Eye } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useAdminBranches } from "@/lib/hooks/use-admin-orders";
import {
  useBespokeReport,
  useClientCountDashboard,
  useCreateSortingReport,
  useDeleteSortingReport,
  useMarkWaybillAudited,
  usePendingInvoiceDashboard,
  useSortingCenterBranchMap,
  useSortingReportView,
} from "@/lib/hooks/use-admin-bespoke-reports";
import { getErrorMessage } from "@/lib/api/client";
import { BESPOKE_REPORTS, findBespokeReport } from "@/lib/admin-bespoke-report-registry";
import type { BespokeReportDef } from "@/types/admin-bespoke-report";
import { formatCurrency } from "@/lib/format";
import { BespokeReportFilters } from "@/components/admin/bespoke-report-filters";
import { DynamicTable } from "@/components/shared/dynamic-table";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MultiSelect } from "@/components/shared/multi-select";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PER_PAGE = 25;
const GROUPS = Array.from(new Set(BESPOKE_REPORTS.map((r) => r.group))) as BespokeReportDef["group"][];

export function BespokeReportsTab() {
  const { hasPermission } = useAuth();
  const visibleReports = useMemo(
    () => BESPOKE_REPORTS.filter((r) => r.permissions.some((p) => hasPermission(p))),
    [hasPermission]
  );

  const [group, setGroup] = useState(GROUPS[0]);
  const groupReports = visibleReports.filter((r) => r.group === group);
  const [reportId, setReportId] = useState<string>(groupReports[0]?.id ?? "");
  const def = findBespokeReport(reportId);

  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [hasRun, setHasRun] = useState(false);

  const { data, isFetching, isError } = useBespokeReport(
    def,
    appliedFilters,
    page,
    PER_PAGE,
    hasRun
  );

  const missingRequired = (def?.filters ?? []).some(
    (f) => f.required && !filterValues[f.key]
  );

  const run = () => {
    if (missingRequired) {
      toast.error("Fill in all required filters first");
      return;
    }
    setAppliedFilters(filterValues);
    setPage(1);
    setHasRun(true);
  };

  return (
    <div className="mt-4 space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <ClientCountDashboardCard />
        <PendingInvoiceDashboardCard />
      </div>

      <SortingCenterBranchCard />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Run a report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-xs">Category</Label>
              <Select
                value={group}
                onValueChange={(v) => {
                  const groupValue = v as BespokeReportDef["group"];
                  setGroup(groupValue);
                  const first = visibleReports.find((r) => r.group === groupValue);
                  setReportId(first?.id ?? "");
                  setHasRun(false);
                  setFilterValues({});
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GROUPS.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">Report</Label>
              <Select
                value={reportId}
                onValueChange={(v) => {
                  setReportId(v);
                  setHasRun(false);
                  setFilterValues({});
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a report" />
                </SelectTrigger>
                <SelectContent>
                  {groupReports.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {def && <p className="text-sm text-muted-foreground">{def.description}</p>}

          {def?.id === "audit-list" && <AuditWidget />}

          {def && (
            <BespokeReportFilters
              fields={def.filters}
              values={filterValues}
              onChange={(k, v) => setFilterValues((s) => ({ ...s, [k]: v }))}
            />
          )}

          <div className="flex justify-end">
            <Button onClick={run} disabled={!def}>
              <Play className="size-4" />
              Run report
            </Button>
          </div>
        </CardContent>
      </Card>

      {hasRun && def && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{def.title}</CardTitle>
          </CardHeader>
          <CardContent>
            {isError ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Couldn&apos;t run this report right now. Check the filters and try again.
              </p>
            ) : def.id === "sorting-reports-list" ? (
              <SortingReportsList rows={data?.items} isLoading={isFetching && !data} />
            ) : (
              <DynamicTable rows={data?.items} isLoading={isFetching && !data} />
            )}
            {def.id !== "sorting-reports-list" && (
              <div className="mt-3">
                <Pagination pagination={data?.pagination} onPageChange={setPage} isLoading={isFetching} />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ClientCountDashboardCard() {
  const { data, isLoading, isError } = useClientCountDashboard();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Client registrations</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : isError ? (
          <p className="text-sm text-muted-foreground">Couldn&apos;t load this right now.</p>
        ) : (
          <div className="grid grid-cols-3 gap-3 text-center">
            <Stat label="This year" value={data?.yearly ?? 0} />
            <Stat label="This month" value={data?.monthly ?? 0} />
            <Stat label="This week" value={data?.weekly ?? 0} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PendingInvoiceDashboardCard() {
  const { data, isLoading, isError } = usePendingInvoiceDashboard();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pending invoice value</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : isError ? (
          <p className="text-sm text-muted-foreground">Couldn&apos;t load this right now.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <Stat label="Payable" value={formatCurrency(data?.total_payable ?? 0)} />
            <Stat label="Due tomorrow" value={formatCurrency(data?.tomorrow_payable ?? 0)} />
            <Stat label="Collected COD" value={formatCurrency(data?.total_collected_cod ?? 0)} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function SortingCenterBranchCard() {
  const { data, isLoading, isError } = useSortingCenterBranchMap();
  if (isLoading || isError || !data || data.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sorting layer → branches</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1 text-sm">
          {data.map((d, i) => (
            <li key={i} className="flex justify-between border-b py-1 last:border-0">
              <span className="font-medium">{d.key}</span>
              <span className="text-muted-foreground">{d.value}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function AuditWidget() {
  const [waybill, setWaybill] = useState("");
  const mutation = useMarkWaybillAudited();

  const submit = () => {
    if (!waybill.trim()) return;
    mutation.mutate(waybill.trim(), {
      onSuccess: () => {
        toast.success("Marked as audited");
        setWaybill("");
      },
      onError: (error) => toast.error(getErrorMessage(error, "Could not mark as audited")),
    });
  };

  return (
    <div className="flex items-end gap-2 rounded-md border bg-muted/30 p-3">
      <div className="flex-1">
        <Label className="mb-1.5 block text-xs">Scan / enter a waybill to mark it audited</Label>
        <Input
          value={waybill}
          onChange={(e) => setWaybill(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Waybill number…"
        />
      </div>
      <Button onClick={submit} disabled={mutation.isPending}>
        {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <ScanLine className="size-4" />}
        Mark audited
      </Button>
    </div>
  );
}

function SortingReportsList({
  rows,
  isLoading,
}: {
  rows: Record<string, unknown>[] | undefined;
  isLoading: boolean;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [viewingId, setViewingId] = useState<number | null>(null);
  const deleteMutation = useDeleteSortingReport();

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          New sorting report
        </Button>
      </div>
      <DynamicTable
        rows={rows}
        isLoading={isLoading}
        emptyMessage="No saved sorting reports yet."
        rowActions={(row) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setViewingId(Number(row.id))}
              title="View comparison"
            >
              <Eye className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                if (!window.confirm(`Delete sorting report "${row.report_name}"?`)) return;
                deleteMutation.mutate(Number(row.id), {
                  onSuccess: () => toast.success("Sorting report deleted"),
                  onError: (error) =>
                    toast.error(getErrorMessage(error, "Could not delete report")),
                });
              }}
              title="Delete"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        )}
      />

      <CreateSortingReportDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ViewSortingReportDialog id={viewingId} onOpenChange={(o) => !o && setViewingId(null)} />
    </div>
  );
}

function CreateSortingReportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: branches, isLoading: branchesLoading } = useAdminBranches();
  const [name, setName] = useState("");
  const [details, setDetails] = useState("");
  const [branchIds, setBranchIds] = useState<string[]>([]);
  const mutation = useCreateSortingReport();

  const branchOptions = (branches ?? []).map((b) => ({ value: String(b.key), label: b.value }));

  const submit = () => {
    if (!name.trim() || !details.trim() || branchIds.length === 0) {
      toast.error("Name, details, and at least one branch are required");
      return;
    }
    mutation.mutate(
      { name: name.trim(), details: details.trim(), branch_ids: branchIds.map(Number) },
      {
        onSuccess: () => {
          toast.success("Sorting report created");
          setName("");
          setDetails("");
          setBranchIds([]);
          onOpenChange(false);
        },
        onError: (error) => toast.error(getErrorMessage(error, "Could not create report")),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New sorting report</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="mb-1.5 block">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={200} />
          </div>
          <div>
            <Label className="mb-1.5 block">Details</Label>
            <Input value={details} onChange={(e) => setDetails(e.target.value)} maxLength={500} />
          </div>
          <div>
            <Label className="mb-1.5 block">Branches</Label>
            <MultiSelect
              options={branchOptions}
              value={branchIds}
              onChange={setBranchIds}
              placeholder={branchesLoading ? "Loading…" : "Select branches"}
              searchPlaceholder="Search…"
              emptyMessage="No branch found."
              disabled={branchesLoading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={mutation.isPending} onClick={submit}>
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ViewSortingReportDialog({
  id,
  onOpenChange,
}: {
  id: number | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { data, isLoading, isError } = useSortingReportView(id);
  return (
    <Dialog open={id !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Processing vs. scanned comparison</DialogTitle>
        </DialogHeader>
        {isError ? (
          <p className="text-sm text-muted-foreground">Couldn&apos;t load this report.</p>
        ) : (
          <DynamicTable rows={data} isLoading={isLoading} emptyMessage="No comparison data." />
        )}
      </DialogContent>
    </Dialog>
  );
}
