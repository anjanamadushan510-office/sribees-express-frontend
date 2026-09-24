"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, RotateCcw, Plus, Eye } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import {
  useBranchDeposits,
  useBranchExpenseApprovals,
} from "@/lib/hooks/use-admin-branch-finances";
import type {
  BranchDepositListParams,
  BranchDepositRow,
  BranchExpenseApprovalListParams,
  BranchExpenseApprovalRow,
} from "@/types/admin-branch-finance";
import { formatCurrency, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BranchDepositFormDialog } from "@/components/forms/branch-deposit-form-dialog";

const PER_PAGE = 15;

const columns: Column<BranchDepositRow>[] = [
  { header: "Branch", cell: (r) => <span className="font-medium">{r.branch_name}</span> },
  { header: "Deposit date", cell: (r) => formatDate(r.Deposited_Date) },
  { header: "Deposit amount", className: "text-right", cell: (r) => formatCurrency(r.deposit_amount) },
  { header: "Expenses", className: "text-right", cell: (r) => formatCurrency(r.expenses) },
  { header: "Remaining", className: "text-right", cell: (r) => formatCurrency(r.remaining_amount) },
  { header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
];

const expenseColumns: Column<BranchExpenseApprovalRow>[] = [
  { header: "Branch", cell: (r) => <span className="font-medium">{r.branch}</span> },
  { header: "Deposit ID", cell: (r) => r.deposit_id },
  { header: "Requested", cell: (r) => formatDate(r.requested_date) },
  {
    header: "Total expenses",
    className: "text-right",
    cell: (r) => formatCurrency(r.expenses_total),
  },
  { header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
  {
    header: "",
    cell: (r) => (
      <Button asChild variant="ghost" size="sm">
        <Link href={`/admin/branch-finances/expenses/${r.deposit_id}`}>
          <Eye className="size-4" />
          View
        </Link>
      </Button>
    ),
  },
];

export default function AdminBranchFinancesPage() {
  const { hasPermission } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <div className="mb-1 flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title="Branch Finances"
          description="Branch cash deposits and pending approvals."
        />
        {hasPermission("branch-deposit") && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            New Deposit
          </Button>
        )}
      </div>
      <BranchDepositFormDialog open={createOpen} onOpenChange={setCreateOpen} />

      <Tabs defaultValue="deposits">
        <TabsList>
          <TabsTrigger value="deposits">Deposits</TabsTrigger>
          <TabsTrigger value="expenses">Expense Approvals</TabsTrigger>
        </TabsList>
        <TabsContent value="deposits">
          <DepositsTab />
        </TabsContent>
        <TabsContent value="expenses">
          <ExpenseApprovalsTab />
        </TabsContent>
      </Tabs>
    </>
  );
}

function DepositsTab() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<BranchDepositListParams>({});

  const { data, isFetching, isError } = useBranchDeposits({
    page,
    perPage: PER_PAGE,
    ...filters,
  });

  const applyFilters = () => {
    setPage(1);
    setFilters({ branch_name: search.trim() || undefined });
  };
  const resetFilters = () => {
    setSearch("");
    setFilters({});
    setPage(1);
  };

  return (
    <>
      <Card className="mb-4 mt-4">
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Branch</label>
            <Input
              placeholder="Search branch…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={applyFilters}>
              <Search className="size-4" />
              Search
            </Button>
            <Button variant="outline" onClick={resetFilters}>
              <RotateCcw className="size-4" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {isError ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Couldn&apos;t load branch deposits right now. Check your connection and try again.
          </CardContent>
        </Card>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data?.items}
            isLoading={isFetching && !data}
            rowKey={(r) => r.id}
            onRowClick={(r) => router.push(`/admin/branch-finances/${r.id}`)}
            emptyMessage="No branch deposits match your filters yet."
          />
          <Pagination
            pagination={data?.pagination}
            onPageChange={setPage}
            isLoading={isFetching}
          />
        </>
      )}
    </>
  );
}

const EXPENSE_STATUSES: BranchExpenseApprovalListParams["expense_status"][] = [
  "pending",
  "approved",
  "rejected",
];

function ExpenseApprovalsTab() {
  const [page, setPage] = useState(1);
  const [status, setStatus] =
    useState<BranchExpenseApprovalListParams["expense_status"]>("pending");
  const [branchName, setBranchName] = useState("");
  const [appliedBranchName, setAppliedBranchName] = useState("");

  const { data, isFetching, isError } = useBranchExpenseApprovals({
    page,
    perPage: PER_PAGE,
    expense_status: status,
    branch_name: appliedBranchName || undefined,
  });

  return (
    <>
      <Card className="mb-4 mt-4">
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="w-full space-y-1 sm:w-48">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v as typeof status);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s!}>
                    {s!.charAt(0).toUpperCase() + s!.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Branch</label>
            <Input
              placeholder="Search branch…"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setAppliedBranchName(branchName.trim());
                  setPage(1);
                }
              }}
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setAppliedBranchName(branchName.trim());
                setPage(1);
              }}
            >
              <Search className="size-4" />
              Search
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setBranchName("");
                setAppliedBranchName("");
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
            Couldn&apos;t load expense approvals right now. Check your connection and try again.
          </CardContent>
        </Card>
      ) : (
        <>
          <DataTable
            columns={expenseColumns}
            rows={data?.items}
            isLoading={isFetching && !data}
            rowKey={(r) => r.deposit_id}
            emptyMessage="No expense-update requests here."
          />
          <Pagination pagination={data?.pagination} onPageChange={setPage} isLoading={isFetching} />
        </>
      )}
    </>
  );
}
