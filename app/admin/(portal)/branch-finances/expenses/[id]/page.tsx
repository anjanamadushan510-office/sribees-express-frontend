"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/providers/auth-provider";
import {
  useApproveBranchExpense,
  useBranchExpenseUpdateDetail,
  useRejectBranchExpense,
} from "@/lib/hooks/use-admin-branch-finances";
import { getErrorMessage } from "@/lib/api/client";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function BranchExpenseUpdateDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { hasPermission } = useAuth();
  const [status, setStatus] = useState<"pending" | "approved" | "rejected">("pending");

  const { data, isLoading, isError } = useBranchExpenseUpdateDetail(id, status);
  const approveMutation = useApproveBranchExpense(id);
  const rejectMutation = useRejectBranchExpense(id);

  return (
    <div className="mx-auto max-w-2xl">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href="/admin/branch-finances">
          <ArrowLeft className="size-4" />
          Back to branch finances
        </Link>
      </Button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Deposit #{id} — Expense update</h1>
          <p className="text-sm text-muted-foreground">
            Review the added expense lines requested for this deposit.
          </p>
        </div>
        {status === "pending" && hasPermission("approve-expense") && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              disabled={approveMutation.isPending}
              onClick={() =>
                approveMutation.mutate(undefined, {
                  onSuccess: () => toast.success("Expenses approved"),
                  onError: (error) =>
                    toast.error(getErrorMessage(error, "Could not approve expenses")),
                })
              }
            >
              {approveMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={rejectMutation.isPending}
              onClick={() => {
                if (!window.confirm("Reject these expense updates?")) return;
                rejectMutation.mutate(undefined, {
                  onSuccess: () => toast.success("Expenses rejected"),
                  onError: (error) =>
                    toast.error(getErrorMessage(error, "Could not reject expenses")),
                });
              }}
            >
              {rejectMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Reject
            </Button>
          </div>
        )}
      </div>

      <div className="mb-4 w-48">
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : isError || !data ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Couldn&apos;t load expense update details right now.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Expense lines ({status})</CardTitle>
          </CardHeader>
          <CardContent>
            {data.results.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No {status} expense lines for this deposit.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {data.results.map((e, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between rounded-md border p-2"
                  >
                    <span>{e.expense_type}</span>
                    <span className="font-medium">{formatCurrency(e.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 flex items-center justify-between border-t pt-3 text-sm">
              <span className="font-medium">Total</span>
              <span className="font-semibold">{formatCurrency(data.total_amount)}</span>
            </div>
            {data.latest_remark && (
              <p className="mt-3 text-sm text-muted-foreground">
                Latest remark: {data.latest_remark}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
