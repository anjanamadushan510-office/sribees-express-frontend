"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, FileClock, Loader2, Play, RotateCcw, Search } from "lucide-react";
import {
  useDownloadReportExcel,
  useGenerateReport,
  useReportDashboardSummary,
  useReportHistory,
  useReportHistoryDetail,
  useReportTypes,
  useRerunReport,
} from "@/lib/hooks/use-admin-reports";
import { useAdminBranches } from "@/lib/hooks/use-admin-orders";
import type { ReportHistoryRow } from "@/types/admin-report";
import { getErrorMessage } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/shared/combobox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BespokeReportsTab } from "@/components/admin/bespoke-reports-tab";

const PER_PAGE = 15;
const DATE_RANGE_TYPES = new Set(["branch_manifest", "diff_dest_manifest"]);
const ALL = "__all__";

export default function AdminReportsPage() {
  return (
    <>
      <PageHeader
        title="Reports"
        description="Generate and download operational reports; track status of past runs."
      />
      <Tabs defaultValue="async">
        <TabsList>
          <TabsTrigger value="async">Async Reports</TabsTrigger>
          <TabsTrigger value="bespoke">Bespoke Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="async">
          <AsyncReportsTab />
        </TabsContent>
        <TabsContent value="bespoke">
          <BespokeReportsTab />
        </TabsContent>
      </Tabs>
    </>
  );
}

function AsyncReportsTab() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState("");
  const [viewingId, setViewingId] = useState<number | null>(null);

  const {
    data: summary,
    isLoading: summaryLoading,
    isError: summaryError,
  } = useReportDashboardSummary();
  const { data: types } = useReportTypes();
  const { data, isFetching, isError } = useReportHistory({
    page,
    per_page: PER_PAGE,
    report_type: typeFilter !== ALL ? typeFilter : undefined,
    status: statusFilter !== ALL ? (statusFilter as ReportHistoryRow["status"]) : undefined,
    search: applied || undefined,
  });
  const rerunMutation = useRerunReport();
  const downloadMutation = useDownloadReportExcel();

  const columns: Column<ReportHistoryRow>[] = [
    { header: "Report", cell: (r) => <span className="font-medium">{r.report_type_label}</span> },
    { header: "Status", cell: (r) => <StatusBadge status={r.status_label} /> },
    { header: "Rows", className: "text-right", cell: (r) => r.row_count ?? "—" },
    { header: "Requested", cell: (r) => formatDate(r.created_at) },
    { header: "Completed", cell: (r) => formatDate(r.completed_at) },
    {
      header: "",
      className: "text-right",
      cell: (r) => (
        <div className="flex justify-end gap-2">
          {r.status === "completed" && (
            <Button
              size="sm"
              variant="outline"
              disabled={downloadMutation.isPending}
              onClick={(e) => {
                e.stopPropagation();
                downloadMutation.mutate(
                  { id: r.id, filenameHint: `${r.report_type}_${r.id}` },
                  {
                    onError: (error) =>
                      toast.error(getErrorMessage(error, "Could not download report")),
                  }
                );
              }}
            >
              <Download className="size-4" />
            </Button>
          )}
          {r.is_final && (
            <Button
              size="sm"
              variant="outline"
              disabled={rerunMutation.isPending}
              onClick={(e) => {
                e.stopPropagation();
                rerunMutation.mutate(r.id, {
                  onSuccess: () => toast.success("Report re-generation started"),
                  onError: (error) =>
                    toast.error(getErrorMessage(error, "Could not re-run report")),
                });
              }}
            >
              <RotateCcw className="size-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="mb-4 mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
        ) : summaryError ? (
          <Card className="sm:col-span-2 lg:col-span-4">
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              Couldn&apos;t load the report summary right now.
            </CardContent>
          </Card>
        ) : (
          <>
            <SummaryCard label="Total reports" value={summary?.total_reports ?? 0} />
            <SummaryCard label="Pending / processing" value={
              (summary?.status_counts.pending ?? 0) + (summary?.status_counts.processing ?? 0)
            } />
            <SummaryCard label="Completed" value={summary?.status_counts.completed ?? 0} />
            <SummaryCard label="Failed" value={summary?.status_counts.failed ?? 0} />
          </>
        )}
      </div>

      <GenerateReportPanel types={types ?? []} />

      <Card className="mb-4 mt-6">
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="min-w-[10rem] flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Search</label>
            <Input
              placeholder="Search report type or error…"
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
          <div className="w-full space-y-1 sm:w-56">
            <label className="text-xs font-medium text-muted-foreground">Report type</label>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All types</SelectItem>
                {types?.map((t) => (
                  <SelectItem key={t.type} value={t.type}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full space-y-1 sm:w-48">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
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
                setTypeFilter(ALL);
                setStatusFilter(ALL);
                setPage(1);
              }}
            >
              <RotateCcw className="size-4" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {isError ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Couldn&apos;t load report history right now. Check your connection and try again.
          </CardContent>
        </Card>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data?.items}
            isLoading={isFetching && !data}
            rowKey={(r) => r.id}
            onRowClick={(r) => setViewingId(r.id)}
            emptyMessage="No reports generated yet."
          />
          <Pagination
            pagination={data?.pagination}
            onPageChange={setPage}
            isLoading={isFetching}
          />
        </>
      )}

      <ReportDetailDialog id={viewingId} onOpenChange={(o) => !o && setViewingId(null)} />
    </>
  );
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function GenerateReportPanel({ types }: { types: { type: string; name: string; description: string }[] }) {
  const [type, setType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [branchId, setBranchId] = useState("");
  const { data: branches, isLoading: branchesLoading } = useAdminBranches();
  const mutation = useGenerateReport();

  const branchOptions = useMemo(
    () => (branches ?? []).map((b) => ({ value: String(b.key), label: b.value })),
    [branches]
  );
  const needsDateRange = DATE_RANGE_TYPES.has(type);
  const selected = types.find((t) => t.type === type);

  const submit = () => {
    if (!type) {
      toast.error("Select a report type");
      return;
    }
    if (needsDateRange && (!startDate || !endDate)) {
      toast.error("This report requires a date range");
      return;
    }
    mutation.mutate(
      {
        type,
        payload: {
          date_range: startDate && endDate ? `${startDate} - ${endDate}` : undefined,
          branch_id: branchId ? Number(branchId) : undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success("Report generation started — check the history table below");
          setStartDate("");
          setEndDate("");
          setBranchId("");
        },
        onError: (error) => toast.error(getErrorMessage(error, "Could not start report")),
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Generate a report</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label className="mb-1.5 block">Report type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select report" />
              </SelectTrigger>
              <SelectContent>
                {types.map((t) => (
                  <SelectItem key={t.type} value={t.type}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block">
              Branch (optional)
            </Label>
            <Combobox
              options={branchOptions}
              value={branchId}
              onChange={setBranchId}
              placeholder={branchesLoading ? "Loading…" : "All branches"}
              searchPlaceholder="Search branch…"
              emptyMessage="No branch found."
              disabled={branchesLoading}
            />
          </div>
          <div>
            <Label className="mb-1.5 block">
              From {needsDateRange && <span className="text-destructive">*</span>}
            </Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 block">
              To {needsDateRange && <span className="text-destructive">*</span>}
            </Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
        {selected && (
          <p className="text-sm text-muted-foreground">{selected.description}</p>
        )}
        <div className="flex justify-end">
          <Button disabled={mutation.isPending} onClick={submit}>
            {mutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Play className="size-4" />
            )}
            Generate report
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ReportDetailDialog({
  id,
  onOpenChange,
}: {
  id: number | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { data, isLoading, isError } = useReportHistoryDetail(id);

  const rows: Record<string, unknown>[] = Array.isArray(data?.result_data)
    ? (data!.result_data as Record<string, unknown>[])
    : [];
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <Dialog open={id !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{data?.report_type_label ?? "Report details"}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : isError || !data ? (
          <p className="text-sm text-muted-foreground">Couldn&apos;t load this report.</p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <StatusBadge status={data.status_label} />
              <span className="text-muted-foreground">
                Requested {formatDate(data.created_at)}
              </span>
              {data.completed_at && (
                <span className="text-muted-foreground">
                  · Completed {formatDate(data.completed_at)}
                </span>
              )}
              {data.row_count != null && (
                <span className="text-muted-foreground">· {data.row_count} rows</span>
              )}
            </div>

            {data.status === "failed" && data.error_message && (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {data.error_message}
              </p>
            )}

            {data.status === "pending" || data.status === "processing" ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileClock className="size-4" />
                This report is still being generated — this dialog refreshes automatically.
              </div>
            ) : rows.length > 0 ? (
              <div className="max-h-[50vh] overflow-auto rounded-md border">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-muted">
                    <tr>
                      {columns.map((c) => (
                        <th key={c} className="whitespace-nowrap px-2 py-1.5 font-medium">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 200).map((row, i) => (
                      <tr key={i} className="border-t">
                        {columns.map((c) => (
                          <td key={c} className="whitespace-nowrap px-2 py-1.5">
                            {String(row[c] ?? "—")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 200 && (
                  <p className="p-2 text-xs text-muted-foreground">
                    Showing first 200 of {rows.length} rows — download the Excel file for the
                    full report.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No row data for this report.</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
